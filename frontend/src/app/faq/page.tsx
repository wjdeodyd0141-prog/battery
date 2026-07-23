'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Faq[]>('/faqs')
      .then(setFaqs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 text-center">
          <p className="text-sm font-medium text-blue-600 mb-2">FAQ</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">자주 묻는 질문</h1>
          <p className="text-gray-500 text-sm">궁금한 점을 빠르게 해결해 드립니다</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>등록된 FAQ가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
            {faqs.map((faq, idx) => (
              <div key={faq.id}>
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full shrink-0">Q{idx + 1}</span>
                  <span className="flex-1 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${openId === faq.id ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${openId === faq.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 pt-1 bg-blue-50/40">
                      <div className="flex gap-3">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0 h-fit mt-0.5">A</span>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 문의 유도 */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-blue-400" />
          <h2 className="font-semibold text-gray-900 mb-1">원하는 답변을 찾지 못하셨나요?</h2>
          <p className="text-sm text-gray-500 mb-5">1:1 문의를 통해 빠르게 도움을 드리겠습니다.</p>
          <Link
            href="/inquiry"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            1:1 문의하기
          </Link>
        </div>
      </div>
    </div>
  );
}
