'use client';

import { useEffect, useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export default function HomeFaqSection() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Faq[]>('/faqs').then(setFaqs).catch(() => {});
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">자주 묻는 질문</h2>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <HelpCircle className="w-4 h-4" />
            <span>{faqs.length}개</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
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
      </div>
    </section>
  );
}
