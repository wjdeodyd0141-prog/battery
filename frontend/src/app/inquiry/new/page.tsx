'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function NewInquiryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!loading && !user) { router.push('/login'); return null; }
  if (loading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('제목을 입력해주세요.'); return; }
    if (content.trim().length < 5) { toast.error('내용을 5자 이상 입력해주세요.'); return; }
    setSaving(true);
    try {
      await api.post('/inquiries', { title: title.trim(), content: content.trim(), isSecret });
      toast.success('문의가 등록되었습니다.');
      router.push('/inquiry');
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/inquiry" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">문의하기</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문의 제목을 입력해주세요"
              maxLength={100}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">내용 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 자세히 작성해주세요."
              rows={8}
              maxLength={2000}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{content.length}/2000</p>
          </div>

          {/* 비밀글 */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setIsSecret((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isSecret ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isSecret ? 'translate-x-5' : ''}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">비밀글로 등록</span>
              <span className="text-xs text-gray-400">(관리자만 확인 가능)</span>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/inquiry" className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              <Send className="w-4 h-4" />
              {saving ? '등록 중...' : '문의 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
