'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function LoginInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'kakao_failed') toast.error('카카오 로그인에 실패했습니다. 다시 시도해 주세요.');
    if (error === 'google_failed') toast.error('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
    if (error === 'invalid_state') toast.error('인증 세션이 만료됐습니다. 다시 시도해 주세요.');
  }, []);

  const handleKakao = () => { window.location.href = `${API_URL}/auth/kakao`; };
  const handleGoogle = () => { window.location.href = `${API_URL}/auth/google`; };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 왼쪽 비주얼 (데스크톱) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 items-center justify-center p-12">
        <div className="text-white max-w-sm">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <Zap className="w-9 h-9 text-white fill-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">다시 만나서 반가워요!</h2>
          <p className="text-blue-100 leading-relaxed text-lg">
            파워뱅크 전시장에서 최고 품질의 배터리를 지금 바로 만나보세요.
          </p>
          <div className="mt-10 space-y-3 text-sm text-blue-200">
            {['3만원 이상 무료 배송', '정품 인증 100% 보장', '당일 발송 (오후 2시 전 주문)'].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-blue-600">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              파워뱅크 전시장
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">로그인 / 회원가입</h1>
            <p className="text-gray-500 mt-2 text-sm">소셜 계정으로 간편하게 이용하세요</p>
          </div>

          <div className="space-y-3">
            {/* 카카오 */}
            <button
              type="button"
              onClick={handleKakao}
              className="w-full h-12 flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#f0d800] rounded-xl font-semibold text-[#191919] text-sm transition-colors shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.387c0 2.07 1.3 3.889 3.27 4.963l-.834 3.113a.281.281 0 0 0 .432.305L8.1 13.524c.294.04.593.063.9.063 4.142 0 7.5-2.634 7.5-5.887C16.5 4.134 13.142 1.5 9 1.5z" fill="#191919"/>
              </svg>
              카카오로 계속하기
            </button>

            {/* 구글 */}
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 rounded-xl font-semibold text-gray-700 text-sm transition-colors shadow-sm border border-gray-200"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              구글로 계속하기
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
            계속 진행하면{' '}
            <Link href="/terms" className="underline hover:text-gray-600">이용약관</Link>
            {' '}및{' '}
            <Link href="/privacy" className="underline hover:text-gray-600">개인정보처리방침</Link>
            에 동의하는 것으로 간주됩니다.
          </p>

          <p className="text-center mt-8">
            <Link href="/admin/login" className="text-xs text-gray-300 hover:text-gray-400 transition-colors">
              관리자
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginInner />
    </Suspense>
  );
}
