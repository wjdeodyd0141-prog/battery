'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Lock, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Inquiry } from '@/lib/types';
import Pagination from '@/components/ui/pagination';

const PAGE_SIZE = 5;

function maskName(str: string): string {
  if (!str) return '';
  if (str.length === 1) return str;
  if (str.length === 2) return str[0] + '*';
  return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1];
}

export default function HomeInquirySection() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Inquiry[]>('/inquiries/public')
      .then(setInquiries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(inquiries.length / PAGE_SIZE);
  const paged = inquiries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">INQUIRY</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">문의게시판</h2>
          </div>
          <Link href="/inquiry" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors font-medium">
            전체보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">등록된 문의가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {paged.map((inquiry) => (
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
                    <p className="font-medium truncate text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                      {inquiry.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{maskName(inquiry.user.name || inquiry.user.username)}</span>
                      <span>·</span>
                      <span>{new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>

            <Pagination current={page} total={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  );
}
