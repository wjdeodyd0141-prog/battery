'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function CheckoutFailPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '결제가 취소되었거나 오류가 발생했습니다.';
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      api.delete(`/orders/${orderId}/pending`).catch(() => {});
    }
  }, [orderId]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
      <p className="text-gray-500 mb-8">{message}</p>
      <div className="flex gap-3 justify-center">
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/cart">장바구니로 돌아가기</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">쇼핑 계속하기</Link>
        </Button>
      </div>
    </div>
  );
}
