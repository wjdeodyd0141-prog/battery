'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Zap, MapPin, Coins, AlertCircle, RefreshCw } from 'lucide-react';
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
  interface Window {
    PaymentWidget: any;
    daum: any;
  }
}

export default function CheckoutPage() {
  const { cart } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ receiverName: '', receiverPhone: '', shippingAddress: '' });
  const [mileageBalance, setMileageBalance] = useState(0);
  const [mileageInput, setMileageInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState('');
  const paymentWidgetRef = useRef<any>(null);
  const paymentMethodsWidgetRef = useRef<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    setForm(f => ({ ...f, receiverName: user.name || '', receiverPhone: user.phone || '', shippingAddress: user.address || '' }));
    api.get<{ balance: number }>('/mileage/balance').then(r => setMileageBalance(r.balance)).catch(() => {});
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user && cart !== null && cart.items.length === 0) router.push('/cart');
  }, [cart, loading, user]);

  const totalAmount = cart?.items.reduce((sum, item) => sum + (item.product.price + (item.optionPrice ?? 0)) * item.quantity, 0) ?? 0;
  const shippingFee = totalAmount >= 30000 ? 0 : 3000;
  const orderTotal = totalAmount + shippingFee;
  const mileageUsed = Math.min(Math.max(0, Number(mileageInput) || 0), Math.min(mileageBalance, orderTotal));
  const finalAmount = orderTotal - mileageUsed;

  // 결제위젯 초기화
  useEffect(() => {
    if (!user || !cart || cart.items.length === 0) return;

    const daum = document.createElement('script');
    daum.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    document.head.appendChild(daum);

    // 올바른 CDN URL: v1/payment-widget (v2는 존재하지 않음)
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment-widget';
    script.async = true;

    script.onerror = () => {
      setWidgetError('결제 모듈을 불러오지 못했습니다 (js.tosspayments.com 접근 불가)');
    };

    script.onload = async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
        const customerKey = user.id;
        const widget = window.PaymentWidget(clientKey, customerKey);
        paymentWidgetRef.current = widget;
        const methodsWidget = await widget.renderPaymentMethods('#payment-methods', { value: finalAmount });
        paymentMethodsWidgetRef.current = methodsWidget;
        await widget.renderAgreement('#payment-agreement');
        setWidgetReady(true);
      } catch (err: any) {
        const msg = err?.message || String(err) || '알 수 없는 오류';
        console.error('[TossWidget]', err);
        setWidgetError(msg);
      }
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
      if (document.head.contains(daum)) document.head.removeChild(daum);
    };
  }, [user?.id, cart?.items.length]);

  useEffect(() => {
    paymentMethodsWidgetRef.current?.updateAmount(finalAmount);
  }, [finalAmount]);

  const openAddressSearch = useCallback(() => {
    if (!window.daum?.Postcode) {
      toast.error('주소 검색을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete(data: any) {
        setForm(f => ({ ...f, shippingAddress: data.roadAddress || data.jibunAddress }));
      },
    }).open();
  }, []);

  if (loading || !user || cart === null) return null;
  if (cart.items.length === 0) return null;

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
        items: cart.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          optionPrice: i.optionPrice ?? 0,
          selectedOptions: i.selectedOptions ?? [],
        })),
        shippingAddress: form.shippingAddress,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        shippingFee,
        mileageUsed,
      });

      if (finalAmount === 0) {
        await api.post(`/orders/${order.id}/complete-free`, {});
        router.push(`/checkout/success?orderId=${order.id}&free=1`);
        return;
      }

      await paymentWidgetRef.current.requestPayment({
        orderId: order.id,
        orderName: cart.items.length === 1
          ? cart.items[0].product.name
          : `${cart.items[0].product.name} 외 ${cart.items.length - 1}건`,
        customerName: form.receiverName,
        customerEmail: user?.email || '',
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (err: any) {
      if (err.code !== 'USER_CANCEL') {
        toast.error(err.message || '결제 중 오류가 발생했습니다.');
      }
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">결제</h1>
      <form onSubmit={handlePayment}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* 배송 정보 */}
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
                  <div className="flex gap-2 mt-1">
                    <Input id="shippingAddress" value={form.shippingAddress} readOnly placeholder="주소 검색 버튼을 눌러주세요" className="flex-1 bg-gray-50 cursor-pointer" onClick={openAddressSearch} />
                    <Button type="button" variant="outline" onClick={openAddressSearch} className="shrink-0 gap-1.5">
                      <MapPin className="w-4 h-4" />주소 검색
                    </Button>
                  </div>
                  {form.shippingAddress && (
                    <Input className="mt-2" placeholder="상세 주소 (동, 호수 등)"
                      onChange={e => setForm(f => ({ ...f, shippingAddress: f.shippingAddress.split(' //')[0] + (e.target.value ? ` // ${e.target.value}` : '') }))}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 주문 상품 */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">주문 상품</h2>
              <div className="space-y-3">
                {cart.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border shrink-0">
                      {item.product.imageUrls?.[0]
                        ? <Image src={item.product.imageUrls[0]} alt={item.product.name} fill className="object-contain p-1" />
                        : <div className="absolute inset-0 flex items-center justify-center"><Zap className="w-6 h-6 text-gray-200" /></div>}
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

            {/* 결제 위젯 */}
            {finalAmount > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold text-gray-900 mb-4">결제 수단</h2>
                {widgetError ? (
                  <div className="space-y-3 py-4">
                    <div className="flex items-start gap-2 text-red-500">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">결제 수단을 불러오지 못했습니다.</p>
                        <p className="text-xs mt-1 text-gray-500 font-mono break-all">{widgetError}</p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => window.location.reload()}>
                      <RefreshCw className="w-3.5 h-3.5" />새로고침
                    </Button>
                  </div>
                ) : !widgetReady ? (
                  <div className="flex items-center justify-center h-32 text-sm text-gray-400">결제 수단 불러오는 중...</div>
                ) : null}
                <div id="payment-methods" />
                <div id="payment-agreement" className="mt-2" />
              </div>
            )}
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

              {mileageBalance > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">마일리지 사용</span>
                    <span className="text-xs text-emerald-500 ml-auto">보유 {mileageBalance.toLocaleString()}원</span>
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" min={0} max={Math.min(mileageBalance, orderTotal)} value={mileageInput}
                      onChange={e => setMileageInput(e.target.value)} placeholder="0" className="h-8 text-sm bg-white" />
                    <Button type="button" variant="outline" size="sm"
                      className="shrink-0 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => setMileageInput(String(Math.min(mileageBalance, orderTotal)))}>
                      전액 사용
                    </Button>
                  </div>
                  {mileageUsed > 0 && <p className="text-xs text-emerald-600 mt-1.5">-{mileageUsed.toLocaleString()}원 할인 적용</p>}
                </div>
              )}

              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg mb-5">
                <span>최종 금액</span>
                <span className="text-blue-600">{finalAmount.toLocaleString()}원</span>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base"
                disabled={processing || (finalAmount > 0 && (!widgetReady || !!widgetError))}
              >
                {processing ? '처리 중...'
                  : finalAmount === 0 ? '마일리지로 무료 결제'
                  : widgetError ? '결제 수단 오류'
                  : !widgetReady ? '로딩 중...'
                  : `${finalAmount.toLocaleString()}원 결제하기`}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">토스페이먼츠 보안 결제</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
