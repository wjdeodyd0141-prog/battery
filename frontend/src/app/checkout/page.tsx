'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { toast } from 'sonner';

declare global {
  interface Window { TossPayments: any; }
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    receiverName: '', receiverPhone: '', shippingAddress: '',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user) {
      setForm((f) => ({
        ...f,
        receiverName: user.name || '',
        receiverPhone: user.phone || '',
        shippingAddress: user.address || '',
      }));
    }
  }, [user, loading]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  if (loading) return null;
  if (!cart || cart.items.length === 0) {
    router.push('/cart');
    return null;
  }

  const totalAmount = cart.items.reduce((sum, item) => sum + (item.product.price + (item.optionPrice ?? 0)) * item.quantity, 0);
  const shippingFee = totalAmount >= 30000 ? 0 : 3000;
  const finalAmount = totalAmount + shippingFee;

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.receiverName || !form.receiverPhone || !form.shippingAddress) {
      toast.error('배송 정보를 모두 입력해주세요.');
      return;
    }
    setProcessing(true);
    try {
      const order = await api.post<Order>('/orders', {
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          optionPrice: i.optionPrice ?? 0,
          selectedOptions: i.selectedOptions ?? [],
        })),
        shippingAddress: form.shippingAddress,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        shippingFee,
      });

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
      const tossPayments = window.TossPayments(clientKey);

      await tossPayments.requestPayment('카드', {
        amount: finalAmount,
        orderId: order.id,
        orderName: cart.items.length === 1
          ? cart.items[0].product.name
          : `${cart.items[0].product.name} 외 ${cart.items.length - 1}건`,
        customerName: form.receiverName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (err: any) {
      toast.error(err.message || '결제 준비 중 오류가 발생했습니다.');
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">결제</h1>
      <form onSubmit={handlePayment}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 배송 정보 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">배송 정보</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="receiverName">받는 분 *</Label>
                    <Input id="receiverName" value={form.receiverName} onChange={update('receiverName')} placeholder="이름" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="receiverPhone">연락처 *</Label>
                    <Input id="receiverPhone" value={form.receiverPhone} onChange={update('receiverPhone')} placeholder="010-0000-0000" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shippingAddress">배송 주소 *</Label>
                  <Input id="shippingAddress" value={form.shippingAddress} onChange={update('shippingAddress')} placeholder="주소를 입력해주세요" className="mt-1" />
                </div>
              </div>
            </div>

            {/* 주문 상품 */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">주문 상품</h2>
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border shrink-0">
                      {item.product.imageUrls?.[0] ? (
                        <Image src={item.product.imageUrls[0]} alt={item.product.name} fill className="object-contain p-1" />
                      ) : <div className="absolute inset-0 flex items-center justify-center"><Zap className="w-6 h-6 text-gray-200" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-gray-400">{item.quantity}개</p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">{((item.product.price + (item.optionPrice ?? 0)) * item.quantity).toLocaleString()}원</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 결제 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">결제 금액</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>상품 금액</span><span>{totalAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>배송비</span>
                  <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg mb-5">
                <span>최종 금액</span>
                <span className="text-blue-600">{finalAmount.toLocaleString()}원</span>
              </div>
              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base" disabled={processing}>
                {processing ? '처리 중...' : `${finalAmount.toLocaleString()}원 결제하기`}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">토스페이먼츠 보안 결제</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
