'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, CheckCircle, Clock, Lock, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Inquiry } from '@/lib/types';

export default function AdminInquiryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ANSWERED'>('ALL');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) { router.push('/'); return; }
    if (user) {
      api.get<Inquiry[]>('/inquiries')
        .then(setInquiries)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user, loading]);

  if (loading || !user) return null;

  const filtered = inquiries.filter((i) => {
    const matchSearch = i.title.includes(search) || (i.user.name || i.user.username).includes(search);
    const matchFilter = filter === 'ALL' || i.status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = inquiries.filter((i) => i.status === 'PENDING').length;
  const answeredCount = inquiries.filter((i) => i.status === 'ANSWERED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">문의 관리</h1>
            <p className="text-xs text-gray-400">총 {inquiries.length}건</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-400">전체</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-400">답변대기</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-400">답변완료</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{answeredCount}</p>
          </div>
        </div>

        {/* 검색 + 필터 */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="제목, 작성자 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            {(['ALL', 'PENDING', 'ANSWERED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2.5 text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {f === 'ALL' ? '전체' : f === 'PENDING' ? '대기' : '완료'}
              </button>
            ))}
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {fetching ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">{search || filter !== 'ALL' ? '검색 결과가 없습니다.' : '등록된 문의가 없습니다.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/inquiry/${inquiry.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {inquiry.status === 'ANSWERED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <CheckCircle className="w-3 h-3" /> 답변완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          <Clock className="w-3 h-3" /> 답변대기
                        </span>
                      )}
                      {inquiry.isSecret && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                    <p className="font-medium text-gray-900 truncate text-sm group-hover:text-blue-600 transition-colors">
                      {inquiry.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{inquiry.user.name || inquiry.user.username}</span>
                      <span>·</span>
                      <span>{new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
