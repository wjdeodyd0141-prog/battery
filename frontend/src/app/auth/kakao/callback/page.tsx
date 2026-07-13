'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/lib/types';

function KakaoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      router.replace('/login');
      return;
    }

    localStorage.setItem('accessToken', token);

    api.get<User>('/auth/me')
      .then((user) => {
        loginWithToken(token, user);
        router.replace('/');
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        router.replace('/login');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-5">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
          <Zap className="w-8 h-8 text-white fill-white" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">카카오 로그인 처리 중...</p>
        </div>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <KakaoCallbackInner />
    </Suspense>
  );
}
