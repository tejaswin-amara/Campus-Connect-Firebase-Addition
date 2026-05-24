import { createContext } from 'react';

export type User = {
  id: string;
  username: string;
  role: 'STUDENT' | 'ADMIN';
  photoURL?: string;
  email?: string;
};

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
