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
    // VULN-03: URL에 token 대신 일회성 code를 받아 서버에서 교환
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      router.replace('/login');
      return;
    }

    // M-4: exchange 응답에서 user 수신, 토큰은 httpOnly 쿠키로 자동 설정됨
    api.get<{ user: User }>(`/auth/kakao/exchange?code=${code}`)
      .then(({ user }) => {
        loginWithToken('', user);
        router.replace('/');
      })
      .catch(() => {
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
