'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Coins, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface MileageUser {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  mileageBalance: number;
}

export default function AdminMileagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [defaultRate, setDefaultRate] = useState('');
  const [rateLoading, setRateLoading] = useState(false);
  const [users, setUsers] = useState<MileageUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<MileageUser | null>(null);
  const [grantAmount, setGrantAmount] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) { router.push('/'); return; }
    if (user) {
      api.get<{ rate: number }>('/admin/mileage/settings').then(r => setDefaultRate(String(r.rate))).catch(() => {});
      loadUsers();
    }
  }, [user, loading]);

  const loadUsers = (q?: string, p = 1) => {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    params.set('page', String(p));
    api.get<{ users: MileageUser[]; totalPages: number }>(`/admin/mileage/users?${params}`)
      .then(r => { setUsers(r.users); setTotalPages(r.totalPages); })
      .catch(() => {});
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    loadUsers(v, 1);
  };

  const goPage = (p: number) => {
    setPage(p);
    loadUsers(search, p);
  };

  const saveRate = async () => {
    const rate = parseFloat(defaultRate);
    if (isNaN(rate) || rate < 0 || rate > 100) { toast.error('0~100 사이 숫자를 입력하세요.'); return; }
    setRateLoading(true);
    try {
      await api.patch('/admin/mileage/settings', { rate });
      toast.success(`기본 적립률을 ${rate}%로 저장했습니다.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setRateLoading(false); }
  };

  const handleGrant = async (isDeduct: boolean) => {
    if (!selectedUser) return;
    const amount = parseInt(grantAmount);
    if (!amount || amount <= 0) { toast.error('금액을 올바르게 입력하세요.'); return; }
    if (!grantReason.trim()) { toast.error('사유를 입력하세요.'); return; }
    setGranting(true);
    try {
      await api.post('/admin/mileage/grant', {
        userId: selectedUser.id,
        amount: isDeduct ? -amount : amount,
        reason: grantReason,
      });
      toast.success(isDeduct ? `${amount.toLocaleString()}원 차감 완료` : `${amount.toLocaleString()}원 지급 완료`);
      setGrantAmount('');
      setGrantReason('');
      setSelectedUser(null);
      loadUsers(search, page);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setGranting(false); }
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">관리자 홈</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">마일리지 관리</h1>
      </div>

      {/* 기본 적립률 설정 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Coins className="w-4 h-4 text-emerald-600" /> 사이트 기본 적립률
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Input
              type="number" min={0} max={100} step={0.1}
              value={defaultRate}
              onChange={e => setDefaultRate(e.target.value)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
          </div>
          <Button onClick={saveRate} disabled={rateLoading} className="bg-emerald-600 hover:bg-emerald-700">
            {rateLoading ? '저장 중...' : '저장'}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">상품별 적립률 미설정 시 이 값이 적용됩니다.</p>
      </div>

      {/* 회원 마일리지 지급/차감 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">회원 마일리지 지급 / 차감</h2>

        {/* 회원 검색 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="회원 검색 (이름, 아이디, 이메일)"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 회원 목록 */}
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
          {users.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">회원이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">회원</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">보유 마일리지</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 cursor-pointer ${selectedUser?.id === u.id ? 'bg-emerald-50' : ''}`}
                    onClick={() => setSelectedUser(u)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.name || u.username}</p>
                      <p className="text-xs text-gray-400">{u.username}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {u.mileageBalance.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-center">
                      {selectedUser?.id === u.id && <span className="text-xs text-emerald-600 font-medium">선택됨</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이징 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mb-4">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === page ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 지급/차감 입력 */}
        {selectedUser && (
          <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-emerald-800">
              {selectedUser.name || selectedUser.username} ({selectedUser.username}) — 현재 {selectedUser.mileageBalance.toLocaleString()}원
            </p>
            <div>
              <Label className="text-xs text-gray-600">금액 (원)</Label>
              <Input type="number" min={1} value={grantAmount} onChange={e => setGrantAmount(e.target.value)} placeholder="예) 5000" className="mt-1 bg-white" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">사유</Label>
              <Input value={grantReason} onChange={e => setGrantReason(e.target.value)} placeholder="예) 이벤트 당첨" className="mt-1 bg-white" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleGrant(false)} disabled={granting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1" /> 지급
              </Button>
              <Button onClick={() => handleGrant(true)} disabled={granting} variant="outline" className="flex-1 text-red-500 border-red-200 hover:bg-red-50">
                <Minus className="w-4 h-4 mr-1" /> 차감
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
