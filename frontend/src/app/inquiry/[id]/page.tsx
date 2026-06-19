'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, CheckCircle, Clock, Trash2, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Inquiry } from '@/lib/types';
import { toast } from 'sonner';

function maskName(str: string): string {
  if (!str) return '';
  if (str.length === 1) return str;
  if (str.length === 2) return str[0] + '*';
  return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1];
}

function displayName(user: { name: string | null; username: string }): string {
  return maskName(user.name || user.username);
}

export default function InquiryDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [fetching, setFetching] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<Inquiry>(`/inquiries/${id}`)
        .then((data) => {
          setInquiry(data);
          setReplyContent(data.reply?.content || '');
        })
        .catch((err: any) => { toast.error(err.message || '문의를 불러올 수 없습니다.'); router.push('/inquiry'); })
        .finally(() => setFetching(false));
    }
  }, [user, loading, id]);

  if (loading || !user || fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!inquiry) return null;

  const isAdmin = user.role === 'ADMIN';
  const isOwner = inquiry.userId === user.id;

  const handleDelete = async () => {
    if (!confirm('문의를 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await api.delete(`/inquiries/${id}`);
      toast.success('문의가 삭제되었습니다.');
      router.push(isAdmin ? '/admin/inquiry' : '/inquiry');
    } catch (err: any) {
      toast.error(err.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) { toast.error('답변 내용을 입력해주세요.'); return; }
    setReplying(true);
    try {
      const updated = await api.post<Inquiry>(`/inquiries/${id}/reply`, { content: replyContent.trim() });
      setInquiry(updated);
      toast.success('답변이 등록되었습니다.');
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.');
    } finally {
      setReplying(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!confirm('답변을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/inquiries/${id}/reply`);
      setInquiry({ ...inquiry, status: 'PENDING', reply: null });
      setReplyContent('');
      toast.success('답변이 삭제되었습니다.');
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={isAdmin ? '/admin/inquiry' : '/inquiry'} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">문의 상세</h1>
          {(isAdmin || isOwner) && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> 삭제
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* 문의 내용 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            {inquiry.status === 'ANSWERED' ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                <CheckCircle className="w-3 h-3" /> 답변완료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                <Clock className="w-3 h-3" /> 답변대기
              </span>
            )}
            {inquiry.isSecret && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                <Lock className="w-3 h-3" /> 비밀글
              </span>
            )}
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-4">{inquiry.title}</h2>

          <div className="flex items-center gap-3 text-xs text-gray-400 mb-5 pb-5 border-b border-gray-100">
            <span>작성자: {isAdmin || isOwner ? (inquiry.user.name || inquiry.user.username) : displayName(inquiry.user)}</span>
            <span>·</span>
            <span>{new Date(inquiry.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inquiry.content}</p>
        </div>

        {/* 답변 */}
        {inquiry.reply && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-sm text-blue-800">관리자 답변</span>
                <span className="text-xs text-blue-400">
                  {new Date(inquiry.reply.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {isAdmin && (
                <button onClick={handleDeleteReply} className="text-xs text-blue-400 hover:text-red-500 transition-colors">
                  답변 삭제
                </button>
              )}
            </div>
            <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{inquiry.reply.content}</p>
          </div>
        )}

        {/* 관리자 답변 폼 */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              {inquiry.reply ? '답변 수정' : '답변 작성'}
            </h3>
            <form onSubmit={handleReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="고객에게 전달할 답변을 작성해주세요."
                rows={5}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={replying}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {replying ? '저장 중...' : inquiry.reply ? '답변 수정' : '답변 등록'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 답변 대기 중 안내 (일반 유저) */}
        {!isAdmin && !inquiry.reply && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 text-center">
            <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-amber-800">답변 대기 중</p>
            <p className="text-xs text-amber-600 mt-1">영업일 기준 1~2일 내 답변드립니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
