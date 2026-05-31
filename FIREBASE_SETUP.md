# Firebase setup — one-time steps

Already done by you:
- Created project `kosh-app-8b023`
- Enabled Email/Password auth
- Created admin user `admin@admin.com`
- Pasted config — the app's [.env.local](.env.local) is wired up

## What you need to do once more in the Firebase Console

### 1. Create Firestore database

Console → Build → **Firestore Database** → "Create database" → start in **production mode** → pick the region closest to you (e.g. `asia-south1` Mumbai). Production mode locks everything down by default — you'll fix that in step 2.

### 2. Publish security rules

Console → Firestore Database → **Rules** tab → paste the contents of [firestore.rules](firestore.rules) → **Publish**.

The rules currently grant a one-time bootstrap to `admin@admin.com`: that email may self-create its own admin profile on first login. Everything else requires an existing admin/treasurer. Once you have at least one admin doc in Firestore, you can edit the rules and remove the `isBootstrapAdmin()` clause for safety (optional).

### 3. Enable Storage + publish its rules (for payment receipts)

Payment receipts are uploaded to Firebase Storage. Console → Build → **Storage** → "Get started" → start in **production mode** → same region as Firestore. Then Console → Storage → **Rules** tab → paste the contents of [storage.rules](storage.rules) → **Publish**.

These rules mirror the Firestore ones: any signed-in member can view receipts, but only admins/treasurers can upload or delete them (files capped at 5 MB). If you skip this step, recording a payment still works — only the file upload fails.

### 4. (Optional but recommended) Set the auth domain

Console → Authentication → **Settings** tab → "Authorized domains" → add your Netlify domain once deployed. `localhost` is added by default.

## First-run flow

1. `npm run dev`
2. The dashboard loads empty (no members yet)
3. Click **Log in** → enter `admin@admin.com` + the password you set in the Console
4. On successful login, the app sees that no member doc exists for your UID **and** your email matches the bootstrap email — it auto-creates your admin profile + the initial `config/fund` doc.
5. You're now admin. Go to **Members** → "Add member" to invite the other 5 friends. Each invite creates a Firebase Auth user + a Firestore profile doc; tell them their initial password and they can change it via "Forgot password?" on the login screen.

## (Optional) Seed demo data in one shot

If you want the original mockup data (6 demo members, payments through Baisakh 2083, the SOHL investment, Rs 64,000 cash) pre-populated, run:

```bash
npm run seed
```

It will prompt for your admin password, sign in as the bootstrap admin, create your admin profile if it doesn't exist yet, then write all demo data to Firestore. **Idempotent** — re-running overwrites the same docs instead of duplicating (all seed records use `seed-*` IDs).

To avoid the password prompt (e.g. in CI):
```bash
SEED_ADMIN_PASSWORD=yourpassword npm run seed
```

The demo members are profile-only (no Firebase Auth accounts) — they exist for tracking historical contributions and won't appear in the login screen. Delete them via the Members page once you've added real members.

## Verifying the migration

In the Firebase Console → Firestore Database → Data tab, after first login you should see:

- `config/fund` — `cashInBank: 0`, `monthlyContribution: 2000`, `lastUpdated: ...`
- `members/{your-uid}` — your admin profile

Add a payment via the Payments page → you should see a `payments/{id}` doc appear in real time.

Open the app in two browser windows (e.g. one logged in as admin, one not) — when admin records a payment, the other window's dashboard updates without a refresh. That's `onSnapshot` real-time sync.

## Where the keys live

- [.env.local](.env.local) — your actual config + bootstrap email. Gitignored.
- [.env.example](.env.example) — committed placeholder so collaborators know the shape.

The Firebase web API key is **not a secret** — it's a public client identifier. Real protection comes from [firestore.rules](firestore.rules), which run server-side and gate every read/write.

## Hardening checklist (when you're ready to share publicly)

- [ ] Tighten [firestore.rules](firestore.rules) — remove the bootstrap clause once you have a real admin
- [ ] Publish [storage.rules](storage.rules) so payment-receipt uploads are gated to admins/treasurers
- [ ] Add Netlify domain to Firebase "Authorized domains"
- [ ] Enable Firebase App Check (optional, prevents abuse from non-app clients)
- [ ] Set Firestore retention/backup if data matters long-term

## Migrating to Netlify

After Firebase is verified working locally:

1. Push code to GitHub
2. Netlify → New site from Git → pick this repo
3. Build command: `npm run build`, publish: `dist`
4. **Environment variables** tab → paste all `VITE_FIREBASE_*` and `VITE_BOOTSTRAP_ADMIN_EMAIL` values from `.env.local`
5. Deploy

## If something goes wrong

- **Login spins forever** → check the browser console; usually `auth/network-request-failed` (offline) or `auth/invalid-credential` (wrong password)
- **"Missing or insufficient permissions"** → rules aren't published, or your member doc role isn't admin/treasurer
- **Bootstrap doesn't auto-create admin profile** → check `VITE_BOOTSTRAP_ADMIN_EMAIL` in `.env.local` matches the email you set in Auth, exactly (case-insensitive)
