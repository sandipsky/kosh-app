import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Member } from '../types';
import { useAppStore } from '../store/useAppStore';
import { AUTH_KEY, AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const members = useAppStore((s) => s.data.members);
  const hydrated = useAppStore((s) => s.hydrated);

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentUserId) localStorage.setItem(AUTH_KEY, currentUserId);
      else localStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
  }, [currentUserId]);

  const currentUser = useMemo<Member | null>(() => {
    if (!hydrated || !currentUserId) return null;
    return members.find((m) => m.id === currentUserId) ?? null;
  }, [members, currentUserId, hydrated]);

  const login = useCallback(
    (username: string, password: string): string | null => {
      const match = members.find(
        (m) => m.username === username && m.password === password
      );
      if (!match) return 'Invalid username or password';
      setCurrentUserId(match.id);
      return null;
    },
    [members]
  );

  const logout = useCallback(() => setCurrentUserId(null), []);

  const value = useMemo(
    () => ({ currentUser, login, logout }),
    [currentUser, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
