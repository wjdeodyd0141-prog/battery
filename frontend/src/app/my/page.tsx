'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Star, MapPin, Phone, Mail, ChevronRight, Edit3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const QUICK_MENU = [
  { href: '/my/orders', icon: Package, label: '주문내역', desc: '주문 현황 확인', color: 'text-blue-600', bg: 'bg-blue-50' },
  { href: '/my/reviews', icon: Star,   label: '내 리뷰',  desc: '작성한 리뷰 관리', color: 'text-amber-600', bg: 'bg-amber-50' },
];

export default function MyPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user) setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
  }, [user, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/profile', form);
      await refreshUser();
      toast.success('프로필이 저장되었습니다.');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = (user.name || user.username).slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 프로필 헤더 배너 */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 pt-10 pb-20 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0">
            {initials}
          </div>
          <div className="text-white">
            <p className="text-xs text-blue-200 mb-1">{user.role === 'ADMIN' ? '👑 관리자' : '일반 회원'}</p>
            <h1 className="text-xl sm:text-2xl font-bold">{user.name || user.username}</h1>
            <p className="text-blue-200 text-sm mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 pb-16 space-y-4">
        {/* 퀵 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-center gap-3 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {/* 계정 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">계정 정보</h2>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3 py-2">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">이메일</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">아이디</p>
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 프로필 편집 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">프로필 편집</h2>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-blue-600 font-medium hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                편집
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">이름</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="이름"
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">전화번호</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">기본 배송 주소</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="기본 배송 주소를 입력하세요"
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setEditing(false)}>
                  취소
                </Button>
                <Button type="submit" className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 rounded-xl" disabled={saving}>
                  {saving ? '저장 중...' : <><Check className="w-4 h-4 mr-1" />저장</>}
                </Button>
              </div>
            </form>
          ) : (
            <div className="px-5 py-4 space-y-1">
              <InfoRow icon={User} label="이름" value={form.name || '미입력'} empty={!form.name} />
              <InfoRow icon={Phone} label="전화번호" value={form.phone || '미입력'} empty={!form.phone} />
              <InfoRow icon={MapPin} label="배송 주소" value={form.address || '미입력'} empty={!form.address} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, empty }: { icon: any; label: string; value: string; empty?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${empty ? 'text-gray-300 italic' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}
