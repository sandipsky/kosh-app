import { createContext } from 'react';
import type { Member } from '../types';

export interface AuthContextValue {
  currentUser: Member | null;
  login: (username: string, password: string) => string | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AUTH_KEY = 'pfnk-current-user';
