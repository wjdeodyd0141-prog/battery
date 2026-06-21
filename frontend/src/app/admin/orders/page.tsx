'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Search, Package, Truck, RefreshCw,
  ChevronLeft, ChevronRight, User, Phone, MapPin, CreditCard, StickyNote,
  Edit3, X, AlertTriangle, XCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import { toast } from 'sonner';

// ─── 상수 ────────────────────────────────────────────────
const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  PENDING:   { label: '결제 대기',  color: 'text-yellow-700',  bg: 'bg-yellow-50',   border: 'border-yellow-200', dot: 'bg-yellow-400' },
  PAID:      { label: '결제 완료',  color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',   dot: 'bg-blue-500' },
  PREPARING: { label: '상품 준비',  color: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-200', dot: 'bg-indigo-500' },
  SHIPPED:   { label: '배송 중',    color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200', dot: 'bg-purple-500' },
  DELIVERED: { label: '배송 완료',  color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200',dot: 'bg-emerald-500' },
  CANCELLED: { label: '취소됨',     color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',    dot: 'bg-red-400' },
  REFUNDED:  { label: '환불됨',     color: 'text-gray-500',    bg: 'bg-gray-100',    border: 'border-gray-200',   dot: 'bg-gray-400' },
};

const STATUS_FLOW: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: 'PREPARING',
  PREPARING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

const ALL_STATUSES: OrderStatus[] = ['PENDING','PAID','PREPARING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'];
const CARRIERS = ['CJ대한통운', '롯데택배', '한진택배', '우체국택배', '로젠택배', '홈픽', '기타'];

interface Stats {
  total: number;
  revenue: number;
  byStatus: Record<string, number>;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── 유틸 ────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.color} ${m.bg} ${m.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원'; }
function shortId(id: string) { return id.slice(-8).toUpperCase(); }

// ─── 통계 카드 ────────────────────────────────────────────
function StatsRow({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }
  const cards = [
    { label: '전체 주문',  value: stats.total + '건',              color: 'text-gray-900' },
    { label: '결제 대기',  value: (stats.byStatus['PENDING'] ?? 0) + '건', color: 'text-yellow-600' },
    { label: '처리 중',    value: ((stats.byStatus['PAID'] ?? 0) + (stats.byStatus['PREPARING'] ?? 0)) + '건', color: 'text-blue-600' },
    { label: '배송 중',    value: (stats.byStatus['SHIPPED'] ?? 0) + '건', color: 'text-purple-600' },
    { label: '배송 완료',  value: (stats.byStatus['DELIVERED'] ?? 0) + '건', color: 'text-emerald-600' },
    { label: '총 매출',    value: fmt(stats.revenue),              color: 'text-gray-900' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">{c.label}</p>
          <p className={`text-lg font-bold ${c.color} leading-tight`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── 주문 상세 모달 ──────────────────────────────────────
function OrderDetailModal({ order, onClose, onUpdate }: {
  order: Order;
  onClose: () => void;
  onUpdate: (updated: Order) => void;
}) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '');
  const [carrier, setCarrier] = useState(order.carrier ?? '');
  const [memo, setMemo] = useState(order.adminMemo ?? '');
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingMemo, setSavingMemo] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  const handleRefund = async () => {
    if (!refundReason.trim()) { toast.error('환불 사유를 입력해주세요.'); return; }
    setProcessingRefund(true);
    try {
      const body: { cancelReason: string; cancelAmount?: number } = { cancelReason: refundReason };
      if (refundAmount && Number(refundAmount) > 0) body.cancelAmount = Number(refundAmount);
      const updated = await api.post<Order>(`/orders/${order.id}/refund`, body);
      onUpdate({ ...order, ...updated });
      toast.success('환불 처리가 완료되었습니다.');
      setShowRefundDialog(false);
      setRefundReason('');
      setRefundAmount('');
    } catch (err: any) {
      toast.error(err.message || '환불 처리에 실패했습니다.');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === 'CANCELLED' || newStatus === 'REFUNDED') {
      setPendingStatus(newStatus);
      setShowCancelConfirm(true);
      return;
    }
    await applyStatus(newStatus);
  };

  const applyStatus = async (newStatus: OrderStatus) => {
    setChangingStatus(true);
    try {
      const updated = await api.patch<Order>(`/orders/${order.id}/status`, { status: newStatus });
      onUpdate({ ...order, ...updated });
      toast.success(`"${STATUS_META[newStatus].label}"로 변경했습니다.`);
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    } finally {
      setChangingStatus(false);
      setShowCancelConfirm(false);
      setPendingStatus(null);
    }
  };

  const handleSaveTracking = async () => {
    if (!trackingNumber.trim() || !carrier) {
      toast.error('배송사와 송장번호를 모두 입력해주세요.');
      return;
    }
    setSavingTracking(true);
    try {
      const updated = await api.patch<Order>(`/orders/${order.id}/tracking`, { trackingNumber, carrier });
      onUpdate({ ...order, ...updated });
      toast.success('송장 정보를 저장하고 배송 중으로 변경했습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally { setSavingTracking(false); }
  };

  const handleSaveMemo = async () => {
    setSavingMemo(true);
    try {
      await api.patch(`/orders/${order.id}/memo`, { adminMemo: memo });
      onUpdate({ ...order, adminMemo: memo });
      toast.success('메모를 저장했습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally { setSavingMemo(false); }
  };

  const nextStatus = STATUS_FLOW[order.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <p className="text-sm font-mono font-bold text-gray-700">주문 #{shortId(order.id)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 상태 변경 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> 상태 변경
            </h3>
            {order.status === 'PENDING' ? (
              <div className="flex items-center gap-2.5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                결제가 완료된 후에 주문을 처리할 수 있습니다.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nextStatus && (
                  <button
                    onClick={() => handleStatusChange(nextStatus)}
                    disabled={changingStatus}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {STATUS_META[nextStatus].label}로 변경
                  </button>
                )}
                {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'REFUNDED' && (
                  <button
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={changingStatus}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> 주문 취소
                  </button>
                )}
                {(order.status === 'DELIVERED' || order.status === 'PAID') && (
                  <button
                    onClick={() => setShowRefundDialog(true)}
                    disabled={changingStatus}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" /> 환불 처리
                  </button>
                )}
                <select
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white focus:outline-none focus:border-blue-400"
                  value=""
                  onChange={e => e.target.value && handleStatusChange(e.target.value as OrderStatus)}
                  disabled={changingStatus}
                >
                  <option value="">직접 상태 선택...</option>
                  {ALL_STATUSES.filter(s => s !== order.status).map(s => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
            )}

            {showCancelConfirm && pendingStatus && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>"{STATUS_META[pendingStatus].label}" 처리하시겠습니까?</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => applyStatus(pendingStatus)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg">확인</button>
                  <button onClick={() => { setShowCancelConfirm(false); setPendingStatus(null); }} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg">취소</button>
                </div>
              </div>
            )}

            {showRefundDialog && (
              <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                  <RefreshCw className="w-4 h-4" /> 환불 처리 (토스페이먼츠 실제 환불)
                </div>
                <input
                  type="text"
                  placeholder="환불 사유 입력 (필수)"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-white"
                />
                <input
                  type="number"
                  placeholder={`환불 금액 (비워두면 전액 ${order.totalAmount.toLocaleString()}원 환불)`}
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  min={1}
                  max={order.totalAmount}
                  className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-white"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowRefundDialog(false); setRefundReason(''); setRefundAmount(''); }}
                    disabled={processingRefund}
                    className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleRefund}
                    disabled={processingRefund}
                    className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                  >
                    {processingRefund ? '처리 중...' : '환불 확인'}
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* 주문 상품 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> 주문 상품
            </h3>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                    {item.product?.imageUrls?.[0] ? (
                      <Image src={item.product.imageUrls[0]} alt={item.product.name} width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-5 h-5" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name ?? '상품 정보 없음'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.quantity}개 × {fmt(item.price)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1 px-1">
                <span className="text-sm text-gray-500">총 결제 금액</span>
                <span className="text-base font-bold text-blue-600">{fmt(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* 고객 / 배송 정보 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> 고객 및 배송 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">받는분</span>
                  <span className="font-medium text-gray-900">{order.receiverName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">연락처</span>
                  <span className="font-medium text-gray-900">{order.receiverPhone}</span>
                </div>
                {order.user && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">회원</span>
                    <span className="font-medium text-gray-900">{order.user.name ?? order.user.username} ({order.user.email})</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gray-500 block mb-0.5">배송지</span>
                    <span className="font-medium text-gray-900 break-all">{order.shippingAddress}</span>
                  </div>
                </div>
              </div>
            </div>
            {order.paymentKey && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl flex items-center gap-2 text-sm">
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500">결제키</span>
                <span className="font-mono text-xs text-gray-600 break-all">{order.paymentKey}</span>
              </div>
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* 송장 정보 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" /> 배송 송장 정보
              {order.status !== 'PENDING' && (
                <span className="text-xs font-normal text-gray-400">· 저장 시 자동으로 배송 중으로 변경됩니다</span>
              )}
            </h3>
            {order.status === 'PENDING' ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 text-center">
                결제 완료 후 송장 정보를 입력할 수 있습니다.
              </div>
            ) : order.status === 'SHIPPED' || order.status === 'DELIVERED' ? (
              <div className="space-y-2">
                {order.trackingNumber ? (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3 text-sm">
                    <Truck className="w-4 h-4 text-purple-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-purple-700">{order.carrier}</span>
                      <span className="text-purple-600 ml-2 font-mono">{order.trackingNumber}</span>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:border-blue-400 sm:w-36 shrink-0"
                  >
                    <option value="">배송사 선택</option>
                    {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="송장번호 수정"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={handleSaveTracking}
                    disabled={savingTracking}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shrink-0"
                  >
                    {savingTracking ? '저장 중...' : '수정'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:border-blue-400 sm:w-36 shrink-0"
                >
                  <option value="">배송사 선택</option>
                  {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="송장번호 입력"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={handleSaveTracking}
                  disabled={savingTracking}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shrink-0"
                >
                  {savingTracking ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* 관리자 메모 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> 관리자 메모
            </h3>
            <div className="flex flex-col gap-2">
              <textarea
                rows={3}
                placeholder="내부 메모 (고객에게 표시되지 않음)"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
              <button
                onClick={handleSaveMemo}
                disabled={savingMemo}
                className="self-end px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {savingMemo ? '저장 중...' : '메모 저장'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────
export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [user, loading]);

  const fetchStats = useCallback(() => {
    api.get<Stats>('/orders/stats').then(setStats).catch(() => {});
  }, []);

  const fetchOrders = useCallback(() => {
    setFetching(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', '15');

    api.get<OrdersResponse>(`/orders/all?${params.toString()}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [statusFilter, search, page]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchStats();
      fetchOrders();
    }
  }, [user, fetchStats, fetchOrders]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const handleFilterChange = (s: string) => { setStatusFilter(s); setPage(1); };

  const handleOrderUpdate = (updated: Order) => {
    setData(prev => prev ? {
      ...prev,
      orders: prev.orders.map(o => o.id === updated.id ? { ...o, ...updated } : o),
    } : prev);
    setSelectedOrder(updated);
    fetchStats();
  };

  if (loading || !user || user.role !== 'ADMIN') return null;

  const filterTabs = [
    { key: 'ALL', label: '전체' },
    { key: 'PENDING', label: '결제대기' },
    { key: 'PAID', label: '결제완료' },
    { key: 'PREPARING', label: '준비중' },
    { key: 'SHIPPED', label: '배송중' },
    { key: 'DELIVERED', label: '배송완료' },
    { key: 'CANCELLED', label: '취소' },
    { key: 'REFUNDED', label: '환불' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">주문 관리</h1>
              <p className="text-sm text-gray-400 mt-0.5">모든 주문을 조회하고 상태를 관리하세요</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* 통계 카드 */}
        <StatsRow stats={stats} />

        {/* 필터 + 검색 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-3 scrollbar-hide">
            {filterTabs.map(t => (
              <button
                key={t.key}
                onClick={() => handleFilterChange(t.key)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === t.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t.label}
                {t.key !== 'ALL' && (stats?.byStatus[t.key] ?? 0) > 0 && (
                  <span className={`ml-1 text-xs ${statusFilter === t.key ? 'opacity-80' : 'text-gray-400'}`}>
                    ({stats!.byStatus[t.key]})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="이름, 전화번호, 주문번호 검색..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
              />
            </div>
            <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              검색
            </button>
            {(search || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter('ALL'); setPage(1); }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 주문 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {fetching ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data || data.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Package className="w-12 h-12 mb-3 text-gray-200" />
              <p className="font-semibold text-gray-500">주문이 없습니다</p>
            </div>
          ) : (
            <>
              {/* 헤더 행 */}
              <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1fr_1.2fr_1fr] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span>주문번호</span>
                <span>상품</span>
                <span>고객</span>
                <span>금액</span>
                <span>상태</span>
                <span>다음 단계</span>
              </div>

              <div className="divide-y divide-gray-50">
                {data.orders.map(order => {
                  const nextStatus = STATUS_FLOW[order.status];
                  const firstItem = order.items[0];
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1.5fr_1fr_1.2fr_1fr] gap-2 md:gap-4 px-5 py-4 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-xs font-mono font-bold text-gray-700">#{shortId(order.id)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</p>
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        {firstItem?.product?.imageUrls?.[0] && (
                          <Image src={firstItem.product.imageUrls[0]} alt="" width={36} height={36} className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{firstItem?.product?.name ?? '상품 정보 없음'}</p>
                          {order.items.length > 1 && <p className="text-xs text-gray-400">외 {order.items.length - 1}개</p>}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-800">{order.receiverName}</p>
                        <p className="text-xs text-gray-400">{order.receiverPhone}</p>
                      </div>

                      <div className="text-sm font-bold text-gray-900">{fmt(order.totalAmount)}</div>

                      <div>
                        <StatusBadge status={order.status} />
                        {order.trackingNumber && (
                          <p className="text-xs text-gray-400 mt-1">{order.carrier} {order.trackingNumber}</p>
                        )}
                      </div>

                      <div onClick={e => e.stopPropagation()}>
                        {nextStatus ? (
                          <button
                            onClick={async () => {
                              try {
                                const updated = await api.patch<Order>(`/orders/${order.id}/status`, { status: nextStatus });
                                handleOrderUpdate({ ...order, ...updated });
                                toast.success(`"${STATUS_META[nextStatus].label}"로 변경했습니다.`);
                              } catch { toast.error('상태 변경 실패'); }
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            {STATUS_META[nextStatus].label}
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-400 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> 상세
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 페이지네이션 */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-400">총 {data.total}건 · {data.page}/{data.totalPages} 페이지</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {(() => {
                      const delta = 2;
                      const left = Math.max(1, page - delta);
                      const right = Math.min(data.totalPages, page + delta);
                      const pages: (number | '...')[] = [];
                      if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
                      for (let i = left; i <= right; i++) pages.push(i);
                      if (right < data.totalPages) { if (right < data.totalPages - 1) pages.push('...'); pages.push(data.totalPages); }
                      return pages.map((p, idx) =>
                        p === '...' ? (
                          <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                              p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-400'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      );
                    })()}
                    <button
                      onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
}
