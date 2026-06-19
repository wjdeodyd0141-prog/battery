'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  name?: string;
  phone?: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed?: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    api.get<User>('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/login', { username, password });
    localStorage.setItem('accessToken', res.accessToken);
    setUser(res.user);
  };

  const register = async (data: RegisterData) => {
    await api.post('/auth/register', data);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const fresh = await api.get<User>('/auth/me');
    setUser(fresh);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
