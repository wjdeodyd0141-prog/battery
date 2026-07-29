'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface B2bInquiry {
  id: string;
  companyName: string;
  bizNumber: string;
  contactName: string;
  phone: string;
  content: string;
  createdAt: string;
}

export default function AdminB2bPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<B2bInquiry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) { router.push('/'); return; }
    if (user) {
      api.get<B2bInquiry[]>('/b2b-inquiries')
        .then(setInquiries)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user, loading]);

  if (loading || !user || fetching) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">관리자 홈</Link>
        <div className="flex items-center gap-3 mt-1">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">B2B 구매 문의</h1>
          <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{inquiries.length}건</span>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-24 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p>접수된 B2B 문의가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map(inq => (
            <div key={inq.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                type="button"
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}
              >
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{inq.companyName}</span>
                    <span className="text-xs text-gray-400">{inq.bizNumber}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {inq.contactName} · {inq.phone}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">
                    {new Date(inq.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </p>
                </div>
                {expanded === inq.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                }
              </button>

              {expanded === inq.id && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-sm">
                    <div><p className="text-xs text-gray-400 mb-1">회사명</p><p className="font-medium text-gray-900">{inq.companyName}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">사업자번호</p><p className="font-medium text-gray-900">{inq.bizNumber}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">담당자</p><p className="font-medium text-gray-900">{inq.contactName}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">연락처</p><p className="font-medium text-gray-900">{inq.phone}</p></div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-2">문의 내용</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{inq.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
