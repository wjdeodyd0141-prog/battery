'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Ticket, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Coupon } from '@/lib/types';
import { toast } from 'sonner';

interface CouponUser { id: string; username: string; name: string | null; email: string | null; }

const DISCOUNT_LABEL = { PERCENT: '%', AMOUNT: '원' };
const TRIGGER_LABEL: Record<string, string> = { NONE: '', SIGNUP: '🎁 가입', FIRST_PURCHASE: '🛍 첫구매' };

export default function AdminCouponsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 쿠폰 생성 폼
  const [form, setForm] = useState({ name: '', discountType: 'PERCENT', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', expiresAt: '', triggerType: 'NONE' });
  const [creating, setCreating] = useState(false);

  // 쿠폰 목록
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 발급 패널 (쿠폰별)
  const [users, setUsers] = useState<CouponUser[]>([]);
  const [search, setSearch] = useState('');
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) { router.push('/'); return; }
    if (user) loadCoupons();
  }, [user, loading]);

  const loadCoupons = () => {
    api.get<Coupon[]>('/admin/coupons').then(setCoupons).catch(() => {});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('쿠폰명을 입력하세요.'); return; }
    const val = parseFloat(form.discountValue);
    if (!val || val <= 0) { toast.error('할인값을 입력하세요.'); return; }
    setCreating(true);
    try {
      await api.post('/admin/coupons', {
        name: form.name,
        discountType: form.discountType,
        discountValue: val,
        minOrderAmount: form.minOrderAmount ? parseInt(form.minOrderAmount) : 0,
        maxDiscountAmount: form.maxDiscountAmount ? parseInt(form.maxDiscountAmount) : undefined,
        expiresAt: form.expiresAt || undefined,
        triggerType: form.triggerType,
      });
      toast.success('쿠폰이 생성됐습니다.');
      setForm({ name: '', discountType: 'PERCENT', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', expiresAt: '', triggerType: 'NONE' });
      loadCoupons();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setCreating(false); }
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setSearch('');
    api.get<CouponUser[]>('/admin/coupons/users').then(setUsers).catch(() => {});
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    api.get<CouponUser[]>(`/admin/coupons/users?search=${encodeURIComponent(v)}`).then(setUsers).catch(() => {});
  };

  const handleIssue = async (couponId: string, userId: string, uname: string) => {
    setIssuing(true);
    try {
      await api.post(`/admin/coupons/${couponId}/issue`, { userId });
      toast.success(`${uname}에게 쿠폰을 발급했습니다.`);
      loadCoupons();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setIssuing(false); }
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">관리자 홈</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">쿠폰 관리</h1>
      </div>

      {/* 쿠폰 생성 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> 새 쿠폰 만들기
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600">쿠폰명</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예) 신규 가입 5% 할인" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">할인 유형</Label>
              <select
                value={form.discountType}
                onChange={e => setForm({ ...form, discountType: e.target.value })}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PERCENT">퍼센트 (%)</option>
                <option value="AMOUNT">금액 (원)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">할인값 ({DISCOUNT_LABEL[form.discountType as keyof typeof DISCOUNT_LABEL]})</Label>
              <Input type="number" min={0} value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} placeholder="예) 5" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">최소 주문금액 (원, 0=제한없음)</Label>
              <Input type="number" min={0} value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="예) 50000" className="mt-1" />
            </div>
            {form.discountType === 'PERCENT' && (
              <div>
                <Label className="text-xs text-gray-600">최대 할인금액 (원, 선택)</Label>
                <Input type="number" min={0} value={form.maxDiscountAmount} onChange={e => setForm({ ...form, maxDiscountAmount: e.target.value })} placeholder="예) 10000" className="mt-1" />
              </div>
            )}
            <div>
              <Label className="text-xs text-gray-600">만료일 (선택)</Label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-gray-600">자동 발급 트리거</Label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {[
                  { value: 'NONE', label: '직접 발급', desc: '어드민이 수동으로 발급' },
                  { value: 'SIGNUP', label: '회원가입', desc: '신규 가입 시 자동 발급' },
                  { value: 'FIRST_PURCHASE', label: '첫 구매', desc: '첫 결제 완료 시 자동 발급' },
                ].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, triggerType: t.value })}
                    className={`p-3 rounded-xl border text-left transition-all ${form.triggerType === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                  >
                    <p className={`text-xs font-semibold ${form.triggerType === t.value ? 'text-blue-700' : 'text-gray-700'}`}>{t.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700">
            {creating ? '생성 중...' : '쿠폰 생성'}
          </Button>
        </form>
      </div>

      {/* 쿠폰 목록 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">쿠폰 목록 ({coupons.length})</h2>
        </div>
        {coupons.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">생성된 쿠폰이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {coupons.map(c => {
              const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
              return (
                <div key={c.id}>
                  <div className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                        {(c as any).triggerType && (c as any).triggerType !== 'NONE' && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                            {TRIGGER_LABEL[(c as any).triggerType]}
                          </span>
                        )}
                        {expired && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">만료됨</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {c.discountType === 'PERCENT'
                          ? `${c.discountValue}% 할인${c.maxDiscountAmount ? ` (최대 ${c.maxDiscountAmount.toLocaleString()}원)` : ''}`
                          : `${c.discountValue.toLocaleString()}원 할인`}
                        {c.minOrderAmount > 0 && ` · ${c.minOrderAmount.toLocaleString()}원 이상`}
                        {c.expiresAt && ` · ~${new Date(c.expiresAt).toLocaleDateString('ko-KR')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {c._count?.userCoupons ?? 0}명
                      </span>
                      <Button
                        size="sm" variant="outline"
                        className="h-8 text-xs gap-1"
                        onClick={() => handleExpand(c.id)}
                      >
                        발급
                        {expandedId === c.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* 발급 패널 */}
                  {expandedId === c.id && (
                    <div className="px-6 pb-5 bg-blue-50/50">
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="회원 검색 (이름, 아이디, 이메일)"
                          value={search}
                          onChange={e => handleSearch(e.target.value)}
                          className="pl-9 bg-white"
                        />
                      </div>
                      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white max-h-52 overflow-y-auto">
                        {users.length === 0 ? (
                          <p className="text-center text-xs text-gray-400 py-6">회원이 없습니다.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-50">
                              {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2.5">
                                    <p className="font-medium text-gray-900 text-xs">{u.name || u.username}</p>
                                    <p className="text-[11px] text-gray-400">{u.username}</p>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                      disabled={issuing}
                                      onClick={() => handleIssue(c.id, u.id, u.name || u.username)}
                                    >
                                      발급
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
