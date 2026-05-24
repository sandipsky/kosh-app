#!/usr/bin/env node
/**
 * One-shot seed script: creates Firebase Auth accounts for 6 demo members,
 * writes their profile docs + historical payments + SOHL investment + cashInBank
 * into Firestore.
 *
 * Usage:
 *   npm run seed                          # prompts for admin password
 *   SEED_ADMIN_PASSWORD=xxx npm run seed  # non-interactive
 *
 * Demo credentials (each member logs in with these on the app):
 *   aman   / aman123    @ aman@koshapp.com
 *   anish  / anish123   @ anish@koshapp.com
 *   isha   / isha123    @ isha@koshapp.com
 *   sajit  / sajit123   @ sajit@koshapp.com
 *   sandip / sandip123  @ sandip@koshapp.com
 *   yadav  / yadav123   @ yadav@koshapp.com
 *
 * Idempotent — re-running:
 *  - if an Auth account already exists for an email, signs in to fetch the UID
 *  - overwrites the Firestore profile doc using that UID
 *  - overwrites payments using fixed seed-pay-N IDs (memberId points at the UID)
 *  - cleans up legacy seed-* member/payment docs from earlier runs
 */

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, exit } from 'node:process';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';

function loadEnvFile(path) {
  const out = {};
  try {
    const text = readFileSync(path, 'utf8');
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  } catch {
    // file missing — that's OK; rely on process env
  }
  return out;
}

const env = { ...loadEnvFile('.env.local'), ...process.env };

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const adminEmail = env.SEED_ADMIN_EMAIL ?? env.VITE_BOOTSTRAP_ADMIN_EMAIL;

if (!firebaseConfig.apiKey) {
  console.error('Missing VITE_FIREBASE_API_KEY (and friends) in .env.local');
  exit(1);
}
if (!adminEmail) {
  console.error('Missing admin email. Set VITE_BOOTSTRAP_ADMIN_EMAIL in .env.local');
  exit(1);
}

async function readPassword(prompt) {
  if (env.SEED_ADMIN_PASSWORD) return env.SEED_ADMIN_PASSWORD;
  const rl = createInterface({ input: stdin, output: stdout });
  const pw = await rl.question(prompt);
  rl.close();
  return pw;
}

// ---------------- demo data ----------------

const NOW = () => new Date().toISOString();

const DEMO_MEMBERS = [
  { legacyId: 'seed-aman',   name: 'Aman',   username: 'aman',   email: 'aman@koshapp.com',   password: 'aman123',   gender: 'male',   role: 'member',    initials: 'AM', color: '#FAEEDA', fg: '#633806' },
  { legacyId: 'seed-anish',  name: 'Anish',  username: 'anish',  email: 'anish@koshapp.com',  password: 'anish123',  gender: 'male',   role: 'treasurer', initials: 'AN', color: '#E6F1FB', fg: '#0C447C' },
  { legacyId: 'seed-isha',   name: 'Isha',   username: 'isha',   email: 'isha@koshapp.com',   password: 'isha123',   gender: 'female', role: 'member',    initials: 'IS', color: '#E1F5EE', fg: '#085041' },
  { legacyId: 'seed-sajit',  name: 'Sajit',  username: 'sajit',  email: 'sajit@koshapp.com',  password: 'sajit123',  gender: 'male',   role: 'member',    initials: 'SA', color: '#E6F1FB', fg: '#0C447C' },
  { legacyId: 'seed-sandip', name: 'Sandip', username: 'sandip', email: 'sandip@koshapp.com', password: 'sandip123', gender: 'male',   role: 'member',    initials: 'SP', color: '#FAEEDA', fg: '#633806' },
  { legacyId: 'seed-yadav',  name: 'Yadav',  username: 'yadav',  email: 'yadav@koshapp.com',  password: 'yadav123',  gender: 'male',   role: 'member',    initials: 'YA', color: '#E1F5EE', fg: '#085041' },
];

const FULL_MONTHS = ['Ashoj 2082', 'Kartik 2082', 'Mangsir 2082', 'Poush 2082', 'Magh 2082'];

function monthToBaseDate(month) {
  const yearStr = month.split(' ')[1] ?? '2082';
  const adYear = Number(yearStr) - 57;
  return `${adYear}-06-01T10:00:00.000Z`;
}

function buildDemoPayments(idMap) {
  const tuples = [];
  for (const month of FULL_MONTHS) {
    for (const m of DEMO_MEMBERS) tuples.push([m.legacyId, month]);
  }
  for (const lid of ['seed-isha', 'seed-sajit', 'seed-yadav']) tuples.push([lid, 'Falgun 2082']);
  for (const lid of ['seed-isha', 'seed-yadav']) tuples.push([lid, 'Chaitra 2082']);
  for (const lid of ['seed-isha', 'seed-yadav']) tuples.push([lid, 'Baisakh 2083']);

  return tuples.map(([legacyId, month], i) => ({
    id: `seed-pay-${i}`,
    memberId: idMap[legacyId],
    month,
    year: Number(month.split(' ')[1]),
    amount: 2000,
    paymentDate: monthToBaseDate(month),
  }));
}

const DEMO_INVESTMENT = {
  id: 'seed-sohl',
  name: 'Solu Hydropower Ltd (SOHL)',
  description: 'Local IPO allotment — 100 units listed Chaitra 1, 2082.',
  type: 'Local IPO',
  manager: 'Anish',
  buyDate: 'Mangsir 2082',
  maturityDate: 'Mangsir 2085',
  buyRate: 100,
  currentRate: 691,
  units: 100,
  status: 'Allotted',
  notes: '100 units allotted. Listed Chaitra 1, 2082. Lock-in 3 yrs.',
};

const AVATAR_PALETTE = [
  { bg: '#FAEEDA', fg: '#633806' },
  { bg: '#E6F1FB', fg: '#0C447C' },
  { bg: '#E1F5EE', fg: '#085041' },
];

function initialsFrom(name) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

// ---------------- main ----------------

async function ensureAdminProfile(db, uid, email) {
  const ref = doc(db, 'members', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  const palette = AVATAR_PALETTE[0];
  await setDoc(ref, {
    name: 'Administrator',
    username: 'admin',
    email,
    gender: 'other',
    role: 'admin',
    initials: initialsFrom('Administrator'),
    color: palette.bg,
    fg: palette.fg,
    createdAt: NOW(),
  });
  return true;
}

async function ensureConfig(db) {
  const ref = doc(db, 'config', 'fund');
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  await setDoc(ref, {
    monthlyContribution: 2000,
    lastUpdated: NOW(),
  });
  return true;
}

/** Either creates a new Auth user or signs in to an existing one to get its UID. */
async function getOrCreateAuthUser(secondaryAuth, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return { uid: cred.user.uid, created: true };
  } catch (e) {
    if (e?.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(secondaryAuth, email, password);
      const uid = cred.user.uid;
      await signOut(secondaryAuth);
      return { uid, created: false };
    }
    throw e;
  }
}

async function cleanupLegacyDocs(db) {
  // Old seed-* member docs from prior runs (before Auth integration)
  for (const lid of DEMO_MEMBERS.map((m) => m.legacyId)) {
    await deleteDoc(doc(db, 'members', lid)).catch(() => {});
  }
  // Old payments — up to 50 prior seed-pay-N entries
  for (let i = 0; i < 50; i++) {
    await deleteDoc(doc(db, 'payments', `seed-pay-${i}`)).catch(() => {});
  }
}

async function main() {
  const adminPassword = await readPassword(`Password for ${adminEmail}: `);
  if (!adminPassword) {
    console.error('Empty password. Aborting.');
    exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const secondaryApp = initializeApp(firebaseConfig, 'seed-secondary');
  const secondaryAuth = getAuth(secondaryApp);

  console.log(`\n→ Signing in as ${adminEmail}…`);
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  } catch (e) {
    console.error(`✗ Sign-in failed: ${e?.code ?? e?.message}`);
    exit(1);
  }
  console.log(`  ✓ Signed in (uid: ${cred.user.uid})`);

  const profileCreated = await ensureAdminProfile(db, cred.user.uid, adminEmail);
  console.log(profileCreated ? '  ✓ Admin profile created (bootstrap)' : '  ✓ Admin profile already exists');

  const configCreated = await ensureConfig(db);
  console.log(configCreated ? '  ✓ config/fund created' : '  ✓ config/fund already exists');

  console.log('\n→ Cleaning up legacy seed-* docs from earlier runs…');
  await cleanupLegacyDocs(db);

  console.log('\n→ Creating Firebase Auth users + profile docs for 6 demo members…');
  const idMap = {};
  const summary = [];
  for (const m of DEMO_MEMBERS) {
    const { uid, created } = await getOrCreateAuthUser(secondaryAuth, m.email, m.password);
    idMap[m.legacyId] = uid;
    summary.push({ name: m.name, email: m.email, password: m.password, created });

    await setDoc(doc(db, 'members', uid), {
      name: m.name,
      username: m.username,
      email: m.email,
      gender: m.gender,
      role: m.role,
      initials: m.initials,
      color: m.color,
      fg: m.fg,
      createdAt: NOW(),
    }, { merge: true });

    console.log(`  ${created ? '✓ created' : '✓ exists '} ${m.email}  (uid: ${uid.slice(0, 8)}…)`);
  }

  const payments = buildDemoPayments(idMap);
  console.log(`\n→ Writing ${payments.length} payments…`);
  for (const p of payments) {
    const { id, ...rest } = p;
    await setDoc(doc(db, 'payments', id), rest, { merge: true });
  }

  console.log('→ Writing SOHL investment…');
  const { id: invId, ...invRest } = DEMO_INVESTMENT;
  await setDoc(doc(db, 'investments', invId), invRest, { merge: true });

  await signOut(auth);

  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│ Demo credentials — share with whoever owns each demo account │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  for (const row of summary) {
    console.log(`│ ${row.name.padEnd(8)} ${row.email.padEnd(28)} ${row.password.padEnd(12)} │`);
  }
  console.log('└──────────────────────────────────────────────────────────────┘');
  console.log('\n✓ Done. Open the app and try logging in as any of the above.');
  exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  exit(1);
});
