'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ticket, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { UserCoupon } from '@/lib/types';

function discountText(c: UserCoupon['coupon']) {
  if (c.discountType === 'PERCENT') {
    return `${c.discountValue}% 할인${c.maxDiscountAmount ? ` (최대 ${c.maxDiscountAmount.toLocaleString()}원)` : ''}`;
  }
  return `${c.discountValue.toLocaleString()}원 할인`;
}

export default function MyCouponsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<UserCoupon[]>('/coupons/my')
        .then(data => { setCoupons(data); })
        .catch(() => {})
        .finally(() => setFetching(false));
      // 읽음 처리
      api.patch('/coupons/mark-read').catch(() => {});
    }
  }, [user, loading]);

  const available = coupons.filter(uc => !uc.isUsed && (!uc.coupon.expiresAt || new Date(uc.coupon.expiresAt) > new Date()));
  const used = coupons.filter(uc => uc.isUsed || (uc.coupon.expiresAt && new Date(uc.coupon.expiresAt) <= new Date()));

  if (loading || fetching) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/my" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">쿠폰함</h1>
          {available.length > 0 && (
            <span className="ml-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{available.length}</span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {coupons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">보유한 쿠폰이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 사용 가능 쿠폰 */}
            {available.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 px-1">사용 가능 ({available.length})</p>
                <div className="space-y-3">
                  {available.map(uc => (
                    <CouponCard key={uc.id} uc={uc} isNew={!uc.isRead} />
                  ))}
                </div>
              </div>
            )}

            {/* 사용/만료 쿠폰 */}
            {used.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 px-1 mt-2">사용 완료 / 만료 ({used.length})</p>
                <div className="space-y-3 opacity-50">
                  {used.map(uc => (
                    <CouponCard key={uc.id} uc={uc} isNew={false} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CouponCard({ uc, isNew }: { uc: UserCoupon; isNew: boolean }) {
  const expired = uc.coupon.expiresAt && new Date(uc.coupon.expiresAt) <= new Date();
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isNew ? 'border-blue-300 shadow-md shadow-blue-100' : 'border-gray-100'}`}>
      <div className="flex">
        {/* 왼쪽 컬러 띠 */}
        <div className={`w-2 shrink-0 ${uc.isUsed || expired ? 'bg-gray-200' : 'bg-blue-600'}`} />
        <div className="flex-1 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {isNew && (
                <span className="inline-block text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full mb-1.5">NEW</span>
              )}
              <p className="font-bold text-gray-900 text-base">{uc.coupon.name}</p>
              <p className="text-lg font-extrabold text-blue-600 mt-0.5">{discountText(uc.coupon)}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                {uc.coupon.minOrderAmount > 0 && (
                  <span>{uc.coupon.minOrderAmount.toLocaleString()}원 이상 사용 가능</span>
                )}
                {uc.coupon.expiresAt && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(uc.coupon.expiresAt).toLocaleDateString('ko-KR')} 까지
                  </span>
                )}
                {!uc.coupon.expiresAt && <span>유효기간 없음</span>}
              </div>
            </div>
            <div className="shrink-0 mt-1">
              {uc.isUsed ? (
                <div className="flex flex-col items-center text-gray-300">
                  <CheckCircle2 className="w-7 h-7" />
                  <span className="text-[10px] mt-0.5">사용됨</span>
                </div>
              ) : expired ? (
                <div className="flex flex-col items-center text-gray-300">
                  <Ticket className="w-7 h-7" />
                  <span className="text-[10px] mt-0.5">만료됨</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-blue-500">
                  <Ticket className="w-7 h-7" />
                  <span className="text-[10px] mt-0.5 font-semibold">사용가능</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
