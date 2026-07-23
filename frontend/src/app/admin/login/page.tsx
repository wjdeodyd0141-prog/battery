'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      router.push('/admin');
    } catch (err: any) {
      toast.error(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="파워뱅크 전시장" className="h-12 w-auto" />
        </div>
        <h1 className="text-xl font-bold text-white text-center mb-6">관리자 로그인</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="아이디"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="h-11 rounded-xl bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder="비밀번호"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="h-11 rounded-xl bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  );
}
