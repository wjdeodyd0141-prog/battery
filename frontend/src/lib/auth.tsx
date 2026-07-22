'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { User } from './types';

const USER_CACHE_KEY = 'cachedUser';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
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
    // 캐시된 사용자 정보로 즉시 표시 (깜빡임 제거)
    const raw = typeof window !== 'undefined' ? localStorage.getItem(USER_CACHE_KEY) : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
        setLoading(false);
      } catch {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    }

    // 백그라운드에서 쿠키 유효성 검증 및 최신 정보 동기화
    api.get<User>('/auth/me')
      .then(fresh => {
        setUser(fresh);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        localStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post<{ user: User }>('/auth/login', { username, password });
    // M-4: 토큰은 서버가 httpOnly 쿠키로 설정 — 여기선 user 정보만 캐시
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
    setUser(res.user);
  };

  // 카카오 로그인 후 호출 (쿠키는 이미 설정됨)
  const loginWithToken = (_token: string, userData: User) => {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    await api.post('/auth/register', data);
  };

  const logout = async () => {
    await api.post('/auth/logout', {}).catch(() => {});
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const fresh = await api.get<User>('/auth/me');
      setUser(fresh);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(fresh));
    } catch {
      // 백그라운드 갱신 실패는 무시
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
