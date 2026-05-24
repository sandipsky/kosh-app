import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BOOTSTRAP_ADMIN_EMAIL, auth } from '../lib/firebase';
import { bootstrapConfig, storage } from '../lib/storage';
import { initialsFrom, pickPaletteByIndex } from '../constants/avatarPalette';
import type { Member } from '../types';
import { useAppStore } from '../store/useAppStore';
import { AuthContext } from './auth-context';

function mapError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return code.replace('auth/', '').replace(/-/g, ' ');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const members = useAppStore((s) => s.data.members);
  const hydrated = useAppStore((s) => s.hydrated);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!fbUser || !hydrated) return;
    const existing = members.find((m) => m.id === fbUser.uid);
    if (existing) return;
    const isBootstrap =
      BOOTSTRAP_ADMIN_EMAIL.length > 0 &&
      fbUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    if (!isBootstrap) return;
    const palette = pickPaletteByIndex(members.length);
    const member: Member = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Administrator',
      username: 'admin',
      email: fbUser.email ?? BOOTSTRAP_ADMIN_EMAIL,
      gender: 'other',
      role: 'admin',
      initials: initialsFrom(fbUser.displayName || 'Administrator'),
      color: palette.bg,
      fg: palette.fg,
      createdAt: new Date().toISOString(),
    };
    storage
      .saveMember(member)
      .then(() => bootstrapConfig())
      .catch((err) => console.error('Bootstrap failed:', err));
  }, [fbUser, hydrated, members]);

  const currentUser = useMemo<Member | null>(() => {
    if (!fbUser || !hydrated) return null;
    return members.find((m) => m.id === fbUser.uid) ?? null;
  }, [fbUser, members, hydrated]);

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        return null;
      } catch (e) {
        const code =
          (e as { code?: string }).code ?? 'auth/unknown';
        return mapError(code);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const sendPasswordReset = useCallback(
    async (email: string): Promise<string | null> => {
      try {
        await sendPasswordResetEmail(auth, email.trim());
        return null;
      } catch (e) {
        const code = (e as { code?: string }).code ?? 'auth/unknown';
        return mapError(code);
      }
    },
    []
  );

  const value = useMemo(
    () => ({ currentUser, authReady, login, logout, sendPasswordReset }),
    [currentUser, authReady, login, logout, sendPasswordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
