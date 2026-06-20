'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { User } from './types';

const USER_CACHE_KEY = 'cachedUser';

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

    // 캐시된 사용자 정보로 즉시 표시 (깜빡임 제거)
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
        setLoading(false);
      } catch {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    }

    // 백그라운드에서 토큰 유효성 검증 및 최신 정보 동기화
    api.get<User>('/auth/me')
      .then(fresh => {
        setUser(fresh);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/login', { username, password });
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
    setUser(res.user);
  };

  const register = async (data: RegisterData) => {
    await api.post('/auth/register', data);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const fresh = await api.get<User>('/auth/me');
      setUser(fresh);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(fresh));
    } catch {
      // 백그라운드 갱신 실패는 무시 — 프로필 저장 자체는 성공
    }
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
