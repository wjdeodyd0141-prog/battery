'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string; dot: string }> = {
  PENDING:   { label: '결제 대기', color: 'text-yellow-700', bg: 'bg-yellow-50',  dot: 'bg-yellow-400' },
  PAID:      { label: '결제 완료', color: 'text-blue-700',   bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  PREPARING: { label: '상품 준비', color: 'text-indigo-700', bg: 'bg-indigo-50',  dot: 'bg-indigo-500' },
  SHIPPED:   { label: '배송 중',   color: 'text-purple-700', bg: 'bg-purple-50',  dot: 'bg-purple-500' },
  DELIVERED: { label: '배송 완료', color: 'text-emerald-700',bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  CANCELLED: { label: '취소됨',    color: 'text-gray-500',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  REFUNDED:  { label: '환불됨',    color: 'text-gray-500',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<Order[]>('/orders')
        .then(setOrders)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user, loading]);

  if (loading || fetching) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/my" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">주문내역</h1>
            <p className="text-xs text-gray-400">총 {orders.length}건</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500 mb-1">아직 주문 내역이 없어요</p>
            <p className="text-sm text-gray-400 mb-6">마음에 드는 배터리를 찾아보세요.</p>
            <Link
              href="/products"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              쇼핑하러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = STATUS_MAP[order.status];
              const firstItem = order.items[0];
              const dateStr = new Date(order.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
              });
              return (
                <Link
                  key={order.id}
                  href={`/my/orders/${order.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  {/* 상단: 날짜 + 상태 */}
                  <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
                    <div>
                      <p className="text-xs font-medium text-gray-500">{dateStr}</p>
                      <p className="text-[11px] text-gray-300 mt-0.5 font-mono">#{order.id.slice(0, 12).toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>

                  {/* 하단: 상품명 + 금액 */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {firstItem?.product?.name}
                          {order.items.length > 1 && (
                            <span className="text-gray-400 font-normal"> 외 {order.items.length - 1}건</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">수량 {order.items.reduce((s, i) => s + i.quantity, 0)}개</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-gray-900">{order.totalAmount.toLocaleString()}원</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
