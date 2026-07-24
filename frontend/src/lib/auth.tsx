'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { api, setMemoryToken } from './api';
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
  // OAuth exchange와 me 요청 간의 race condition 방지용 버전 카운터
  const loginVersionRef = useRef(0);

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
    const versionAtStart = loginVersionRef.current;
    api.get<User>('/auth/me')
      .then(fresh => {
        setUser(fresh);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        // loginWithToken이 이 요청 도중 호출됐다면 사용자를 지우지 않음
        if (loginVersionRef.current === versionAtStart) {
          localStorage.removeItem(USER_CACHE_KEY);
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/login', { username, password });
    setMemoryToken(res.accessToken);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
    setUser(res.user);
  };

  // 카카오/구글 로그인 후 호출 (쿠키는 이미 설정됨)
  const loginWithToken = (token: string, userData: User) => {
    loginVersionRef.current += 1; // me 요청의 catch가 사용자를 덮어쓰지 못하도록 버전 증가
    if (token) setMemoryToken(token);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    await api.post('/auth/register', data);
  };

  const logout = async () => {
    await api.post('/auth/logout', {}).catch(() => {});
    setMemoryToken(null);
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
