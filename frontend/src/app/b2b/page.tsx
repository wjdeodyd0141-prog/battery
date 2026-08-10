'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Form {
  companyName: string;
  bizNumber: string;
  contactName: string;
  phone: string;
  content: string;
}

const INIT: Form = { companyName: '', bizNumber: '', contactName: '', phone: '', content: '' };

export default function B2bPage() {
  const [form, setForm] = useState<Form>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const formatPhone = (val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 11);
    if (d.startsWith('02')) {
      if (d.length <= 2) return d;
      if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
      if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
      return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
    }
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.bizNumber || !form.contactName || !form.phone || !form.content) {
      toast.error('모든 항목을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/b2b-inquiries', form);
      setDone(true);
    } catch {
      toast.error('제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">문의가 접수되었습니다</h2>
        <p className="text-gray-500 mb-8">담당자가 확인 후 연락드리겠습니다.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setForm(INIT); setDone(false); }} variant="outline">추가 문의하기</Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">B2B 구매 문의</h1>
        </div>
        <p className="text-gray-500 text-sm">기업·단체 대량 구매 문의를 남겨주시면 담당자가 연락드립니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="companyName">회사명 <span className="text-red-500">*</span></Label>
            <Input id="companyName" value={form.companyName} onChange={set('companyName')} className="mt-1" placeholder="(주)파워뱅크" />
          </div>
          <div>
            <Label htmlFor="bizNumber">사업자번호 <span className="text-red-500">*</span></Label>
            <Input id="bizNumber" value={form.bizNumber} onChange={set('bizNumber')} className="mt-1" placeholder="000-00-00000" />
          </div>
          <div>
            <Label htmlFor="contactName">담당자명 <span className="text-red-500">*</span></Label>
            <Input id="contactName" value={form.contactName} onChange={set('contactName')} className="mt-1" placeholder="홍길동" />
          </div>
          <div>
            <Label htmlFor="phone">연락처 <span className="text-red-500">*</span></Label>
            <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))} className="mt-1" placeholder="010-0000-0000" inputMode="tel" />
          </div>
        </div>

        <div>
          <Label htmlFor="content">문의 내용 <span className="text-red-500">*</span></Label>
          <Textarea
            id="content"
            value={form.content}
            onChange={set('content')}
            className="mt-1"
            rows={6}
            placeholder="구매 희망 상품, 수량, 납기 등 문의 내용을 자유롭게 작성해주세요."
          />
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold" disabled={submitting}>
          {submitting ? '제출 중...' : '문의 접수하기'}
        </Button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        문의 내용은 영업일 기준 1~2일 내 답변 드립니다. &nbsp;·&nbsp; 전화 문의: 02-2668-3799
      </p>
    </div>
  );
}
