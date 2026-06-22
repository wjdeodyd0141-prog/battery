'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Plus, Lock, ChevronRight, CheckCircle, Clock, HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Inquiry } from '@/lib/types';
import Pagination from '@/components/ui/pagination';

interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

const PAGE_SIZE = 10;

function maskName(str: string): string {
  if (!str) return '';
  if (str.length === 1) return str;
  if (str.length === 2) return str[0] + '*';
  return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1];
}

function displayName(user: { name: string | null; username: string }): string {
  return maskName(user.name || user.username);
}

export default function InquiryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Faq[]>('/faqs').then(setFaqs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<Inquiry[]>('/inquiries')
        .then(setInquiries)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user, loading]);

  if (loading || !user) return null;

  const pendingCount = inquiries.filter((i) => i.status === 'PENDING').length;
  const answeredCount = inquiries.filter((i) => i.status === 'ANSWERED').length;
  const totalPages = Math.ceil(inquiries.length / PAGE_SIZE);
  const paged = inquiries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">문의게시판</h1>
              </div>
              <p className="text-sm text-gray-500">궁금한 점이나 불편 사항을 남겨주세요. 빠르게 답변드립니다.</p>
            </div>
            <Link
              href="/inquiry/new"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> 문의하기
            </Link>
          </div>

          <div className="flex items-center gap-5 mt-5">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-gray-500">답변 대기</span>
              <span className="font-bold text-gray-900">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-500">답변 완료</span>
              <span className="font-bold text-gray-900">{answeredCount}</span>
            </div>
            <span className="text-xs text-gray-400 ml-auto">총 {inquiries.length}건</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-semibold">등록된 문의가 없습니다</p>
            <p className="text-sm mt-1">궁금한 점을 문의해보세요.</p>
            <Link
              href="/inquiry/new"
              className="mt-6 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> 첫 문의 작성하기
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {paged.map((inquiry) => {
                const isOwn = inquiry.userId === user.id;
                const canView = isOwn || user.role === 'ADMIN';
                const Row = (
                  <div className="flex items-center gap-4 px-5 py-4 transition-colors group">
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
                        {!canView && <Lock className="w-3 h-3 text-gray-400" />}
                      </div>
                      <p className={`font-medium truncate text-sm ${canView ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-400'} transition-colors`}>
                        {!canView ? '내용을 확인할 수 없습니다.' : inquiry.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{displayName(inquiry.user)}</span>
                        <span>·</span>
                        <span>{new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${canView ? 'text-gray-300 group-hover:text-blue-400' : 'text-gray-200'}`} />
                  </div>
                );
                return canView ? (
                  <Link key={inquiry.id} href={`/inquiry/${inquiry.id}`} className="block hover:bg-gray-50">
                    {Row}
                  </Link>
                ) : (
                  <div key={inquiry.id} className="cursor-not-allowed opacity-70">
                    {Row}
                  </div>
                );
              })}
            </div>

            <Pagination current={page} total={totalPages} onChange={handlePageChange} />
          </>
        )}

        {/* FAQ 섹션 */}
        {faqs.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">자주 묻는 질문</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{faqs.length}개</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {faqs.map((faq, idx) => (
                <div key={faq.id}>
                  <button
                    onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">Q{idx + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openFaqId === faq.id ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ease-in-out ${openFaqId === faq.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-4 pt-1 bg-blue-50/50">
                        <div className="flex gap-3">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 h-fit">A</span>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
