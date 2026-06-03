import { createContext } from 'react';
import type { Member } from '../types';

export interface AuthContextValue {
  currentUser: Member | null;
  authReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
