'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/lib/types';

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      router.replace('/login');
      return;
    }

    api.get<{ user: User; accessToken: string }>(`/auth/oauth/exchange?code=${code}`)
      .then(({ user, accessToken }) => {
        loginWithToken(accessToken, user);
        router.replace('/');
      })
      .catch(() => {
        router.replace('/login');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-5">
        <img src="/logo.png" alt="파워뱅크 전시장" className="h-14 w-auto" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">구글 로그인 처리 중...</p>
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
