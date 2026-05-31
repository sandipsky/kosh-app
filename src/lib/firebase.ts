import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const BOOTSTRAP_ADMIN_EMAIL: string =
  import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL ?? '';

export function isBootstrapAdmin(member: { email?: string | null }): boolean {
  if (!BOOTSTRAP_ADMIN_EMAIL) return false;
  return (
    (member.email ?? '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Firebase Storage holds payment receipt attachments. Payment docs store only
// the download URL + storage path, so the live payments snapshot stays light.
export const fileStorage = getStorage(app);

const secondaryApp = initializeApp(firebaseConfig, 'kosh-secondary');
export const secondaryAuth = getAuth(secondaryApp);
