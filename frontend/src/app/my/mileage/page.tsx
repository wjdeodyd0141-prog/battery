'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { MileageHistory } from '@/lib/types';

const TYPE_MAP = {
  EARN:  { label: '구매 적립', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp },
  USE:   { label: '사용',      color: 'text-red-500',     bg: 'bg-red-50',     icon: TrendingDown },
  ADMIN: { label: '관리자 지급', color: 'text-blue-600',  bg: 'bg-blue-50',    icon: Settings },
};

export default function MileagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<MileageHistory[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (user) {
      Promise.all([
        api.get<{ balance: number }>('/mileage/balance'),
        api.get<{ history: MileageHistory[] }>('/mileage/history'),
      ]).then(([b, h]) => {
        setBalance(b.balance);
        setHistory(h.history);
      }).catch(() => {}).finally(() => setFetching(false));
    }
  }, [user, loading]);

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
          <h1 className="text-lg font-bold text-gray-900">마일리지</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 잔액 카드 */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-5 h-5 text-yellow-300" />
            <span className="text-sm text-emerald-100">보유 마일리지</span>
          </div>
          <p className="text-3xl font-bold">{balance.toLocaleString()}<span className="text-lg font-normal ml-1">원</span></p>
          <p className="text-xs text-emerald-200 mt-2">결제 시 1원 단위로 사용 가능합니다</p>
        </div>

        {/* 내역 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">적립/사용 내역</h2>
          </div>
          {history.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Coins className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">마일리지 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map((item) => {
                const t = TYPE_MAP[item.type];
                const Icon = t.icon;
                const isPositive = item.amount > 0;
                return (
                  <div key={item.id} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${t.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${t.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.reason}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{item.amount.toLocaleString()}원
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
