'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleKakaoLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    window.location.href = `${apiUrl}/auth/kakao`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { toast.error('아이디를 입력해주세요.'); return; }
    if (!form.password) { toast.error('비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('로그인 성공!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
              3만원 이상 무료 배송
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
              정품 인증 100% 보장
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
              당일 발송 (오후 2시 전 주문)
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 폼 */}
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

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">로그인</h1>
            <p className="text-gray-500 mt-1.5">아이디와 비밀번호를 입력해주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">아이디</Label>
              <Input
                id="username"
                placeholder="아이디 입력"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="h-11 rounded-xl border-gray-200 focus:border-blue-500"
               
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호 입력"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-11 rounded-xl border-gray-200 focus:border-blue-500 pr-10"
                 
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-base mt-2"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-50 px-3 text-gray-400">또는</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full h-11 flex items-center justify-center gap-2.5 bg-[#FEE500] hover:bg-[#f0d800] rounded-xl font-semibold text-[#000000] text-sm transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.387c0 2.07 1.3 3.889 3.27 4.963l-.834 3.113a.281.281 0 0 0 .432.305L8.1 13.524c.294.04.593.063.9.063 4.142 0 7.5-2.634 7.5-5.887C16.5 4.134 13.142 1.5 9 1.5z" fill="#000000"/>
            </svg>
            카카오로 로그인
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            아직 회원이 아니신가요?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-semibold">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
