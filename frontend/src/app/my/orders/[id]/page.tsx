'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Zap, MapPin, Phone, User, Check, Truck, Package, PartyPopper, XCircle, AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import { toast } from 'sonner';

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string; dot: string; step: number }> = {
  PENDING:   { label: '결제 대기', color: 'text-yellow-700', bg: 'bg-yellow-50',  dot: 'bg-yellow-400', step: 0 },
  PAID:      { label: '결제 완료', color: 'text-blue-700',   bg: 'bg-blue-50',    dot: 'bg-blue-500',   step: 1 },
  PREPARING: { label: '상품 준비', color: 'text-indigo-700', bg: 'bg-indigo-50',  dot: 'bg-indigo-500', step: 2 },
  SHIPPED:   { label: '배송 중',   color: 'text-purple-700', bg: 'bg-purple-50',  dot: 'bg-purple-500', step: 3 },
  DELIVERED: { label: '배송 완료', color: 'text-emerald-700',bg: 'bg-emerald-50', dot: 'bg-emerald-500',step: 4 },
  CANCELLED: { label: '취소됨',    color: 'text-gray-500',   bg: 'bg-gray-100',   dot: 'bg-gray-400',   step: -1 },
  REFUNDED:  { label: '환불됨',    color: 'text-gray-500',   bg: 'bg-gray-100',   dot: 'bg-gray-400',   step: -1 },
};

const STEPS = [
  { label: '결제 완료', icon: Check },
  { label: '상품 준비', icon: Package },
  { label: '배송 중',   icon: Truck },
  { label: '배송 완료', icon: PartyPopper },
];

export default function OrderDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnType, setReturnType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (user && params.id) {
      api.get<Order>(`/orders/${params.id}`)
        .then(setOrder)
        .catch(() => router.push('/my/orders'));
    }
  }, [user, loading, params.id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await api.patch<Order>(`/orders/${params.id}/cancel`, {});
      setOrder(updated);
      setShowCancelConfirm(false);
      toast.success('주문이 취소되었습니다.');
    } catch (e: any) {
      toast.error(e.message ?? '주문 취소에 실패했습니다.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) { toast.error('사유를 입력해주세요.'); return; }
    setReturning(true);
    try {
      const updated = await api.post<Order>(`/orders/${params.id}/return-request`, { returnType, returnReason });
      setOrder(updated);
      setShowReturnForm(false);
      setReturnReason('');
      toast.success(returnType === 'RETURN' ? '반품 신청이 접수되었습니다.' : '교환 신청이 접수되었습니다.');
    } catch (e: any) {
      toast.error(e.message ?? '신청에 실패했습니다.');
    } finally {
      setReturning(false);
    }
  };

  if (!order) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const status = STATUS_MAP[order.status];
  const dateStr = new Date(order.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/my/orders" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">주문 상세</h1>
            <p className="text-xs text-gray-400">{dateStr}</p>
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 배송 진행 스텝 */}
        {status.step >= 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-sm text-gray-900 mb-5">배송 현황</h2>
            <div className="relative flex items-start justify-between">
              {/* 연결선 */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.max(0, (status.step - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              {STEPS.map((step, i) => {
                const done = status.step > i;
                const active = status.step === i + 1;
                const StepIcon = step.icon;
                return (
                  <div key={step.label} className="flex flex-col items-center gap-2 z-10 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      done   ? 'bg-blue-600 text-white' :
                      active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                               'bg-gray-100 text-gray-300'
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-[11px] text-center leading-tight ${
                      done || active ? 'text-blue-600 font-semibold' : 'text-gray-400'
                    }`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 배송 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-sm text-gray-900 mb-4">배송 정보</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">받는 분</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{order.receiverName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">연락처</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{order.receiverPhone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">주소</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{order.shippingAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-sm text-gray-900 mb-4">주문 상품</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-14 h-14 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shrink-0">
                  {item.product.imageUrls?.[0] ? (
                    <Image src={item.product.imageUrls[0]} alt={item.product.name} fill className="object-contain p-1.5" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-gray-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.quantity}개 × {item.price.toLocaleString()}원</p>
                </div>
                <p className="text-sm font-bold text-gray-900 shrink-0">{(item.quantity * item.price).toLocaleString()}원</p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>상품 금액</span>
              <span>{order.totalAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>배송비</span>
              <span className="text-emerald-600 font-medium">무료</span>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">최종 결제 금액</span>
            <span className="text-lg font-bold text-blue-600">{order.totalAmount.toLocaleString()}원</span>
          </div>
        </div>

        {/* 배송 추적 정보 */}
        {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && order.trackingNumber && (
          <div className="bg-white rounded-2xl border border-purple-200 p-5">
            <h2 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-500" /> 배송 추적
            </h2>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">배송사</p>
                <p className="text-sm font-semibold text-purple-700">{order.carrier}</p>
              </div>
              <div className="w-px h-8 bg-purple-200 mx-1" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">송장번호</p>
                <p className="text-sm font-mono font-bold text-purple-700">{order.trackingNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* 주문 취소 */}
        {(order.status === 'PAID' || order.status === 'PREPARING') && (
          <div>
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold rounded-2xl transition-colors"
              >
                <XCircle className="w-4 h-4" /> 주문 취소 요청
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 text-sm">주문을 취소하시겠습니까?</p>
                    <p className="text-xs text-red-500 mt-1">취소 후에는 되돌릴 수 없습니다. 환불은 영업일 기준 3~5일 소요될 수 있습니다.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {cancelling ? '처리 중...' : '취소 확인'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors"
                  >
                    돌아가기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 반품/교환 신청 */}
        {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && !order.returnStatus && (
          <div>
            {!showReturnForm ? (
              <button
                onClick={() => setShowReturnForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-orange-200 text-orange-500 hover:bg-orange-50 text-sm font-semibold rounded-2xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> 반품 / 교환 신청
              </button>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-4">
                <p className="font-semibold text-orange-700 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> 반품 / 교환 신청
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReturnType('RETURN')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${returnType === 'RETURN' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" /> 반품 (환불)
                  </button>
                  <button
                    onClick={() => setReturnType('EXCHANGE')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${returnType === 'EXCHANGE' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    <RefreshCw className="w-4 h-4 inline mr-1" /> 교환
                  </button>
                </div>
                <textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="사유를 입력해주세요 (예: 상품 불량, 단순 변심 등)"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                  rows={3}
                />
                <p className="text-xs text-orange-600">신청 후 관리자 검토 후 처리됩니다. 반품은 상품 수령 후 7일 이내 신청 가능합니다.</p>
                <div className="flex gap-2">
                  <button onClick={handleReturnRequest} disabled={returning}
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                    {returning ? '처리 중...' : '신청하기'}
                  </button>
                  <button onClick={() => { setShowReturnForm(false); setReturnReason(''); }} disabled={returning}
                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl">
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 반품/교환 신청 현황 */}
        {order.returnStatus && (
          <div className={`rounded-2xl border p-4 ${
            order.returnStatus === 'REQUESTED' ? 'bg-orange-50 border-orange-200' :
            order.returnStatus === 'APPROVED'  ? 'bg-emerald-50 border-emerald-200' :
                                                 'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-sm font-semibold mb-1">
              {order.returnType === 'RETURN' ? '반품' : '교환'} 신청 현황
            </p>
            <p className="text-xs text-gray-600">사유: {order.returnReason}</p>
            <p className={`text-xs font-semibold mt-2 ${
              order.returnStatus === 'REQUESTED' ? 'text-orange-600' :
              order.returnStatus === 'APPROVED'  ? 'text-emerald-600' : 'text-gray-500'
            }`}>
              {order.returnStatus === 'REQUESTED' ? '⏳ 검토 중' :
               order.returnStatus === 'APPROVED'  ? '✅ 승인됨' : '❌ 거절됨'}
            </p>
          </div>
        )}

        {/* 주문 번호 */}
        <div className="text-center py-2">
          <p className="text-xs text-gray-300 font-mono">주문번호 {order.id}</p>
        </div>
      </div>
    </div>
  );
}
