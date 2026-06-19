'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Truck, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { Order } from '@/lib/types';
import { toast } from 'sonner';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart, refresh } = useCart();
  const [step, setStep] = useState<'confirming' | 'done' | 'error'>('confirming');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount'));

    if (!paymentKey || !orderId || !amount) {
      setError('잘못된 접근입니다.');
      setStep('error');
      return;
    }

    api.post<{ order: Order }>('/payments/confirm', { paymentKey, orderId, amount })
      .then(async (data) => {
        clearCart();
        await refresh();
        setOrder(data.order);
        setStep('done');
        toast.success('결제가 완료되었습니다!');
      })
      .catch((err) => {
        setError(err.message || '결제 확인 중 오류가 발생했습니다.');
        setStep('error');
      });
  }, []);

  if (step === 'confirming') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">결제 확인 중...</p>
          <p className="text-sm text-gray-400 mt-1">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-lg font-semibold text-gray-800">{error}</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/cart">장바구니로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-11 h-11 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">결제 완료!</h1>
        <p className="text-gray-500 mt-1.5">주문이 성공적으로 접수되었습니다.</p>
      </div>

      {order && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">주문번호</span>
            <span className="font-mono font-semibold text-gray-800">#{order.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">결제 금액</span>
            <span className="font-bold text-blue-600 text-base">{order.totalAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">받는 분</span>
            <span className="font-medium text-gray-800">{order.receiverName}</span>
          </div>
          <div className="flex justify-between items-start text-sm gap-4">
            <span className="text-gray-500 shrink-0">배송지</span>
            <span className="font-medium text-gray-800 text-right">{order.shippingAddress}</span>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold text-blue-700 mb-3">앞으로의 진행 순서</p>
        <div className="space-y-2.5">
          {[
            { icon: CheckCircle, label: '주문 접수 완료', done: true },
            { icon: Package, label: '상품 준비 중 (1~2일)', done: false },
            { icon: Truck, label: '배송 출발', done: false },
            { icon: MapPin, label: '배송 완료', done: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-blue-600' : 'bg-blue-100'}`}>
                <s.icon className={`w-3.5 h-3.5 ${s.done ? 'text-white' : 'text-blue-300'}`} />
              </div>
              <span className={`text-sm ${s.done ? 'font-semibold text-blue-700' : 'text-blue-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-500 mt-3">배송 현황은 마이페이지에서 실시간으로 확인할 수 있습니다.</p>
      </div>

      <div className="flex gap-3">
        <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-sm font-semibold whitespace-nowrap">
          <Link href="/my/orders" className="flex items-center justify-center gap-2">
            <Package className="w-4 h-4 shrink-0" />
            주문 내역 보기
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1 h-12 text-sm font-semibold whitespace-nowrap">
          <Link href="/products" className="flex items-center justify-center gap-2">
            계속 쇼핑하기
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
