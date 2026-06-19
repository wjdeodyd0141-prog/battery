'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, Crown, User, Search, Pencil, X,
  Phone, MapPin, Mail, Shield, ShieldCheck, CalendarDays, AtSign
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  email: string;
  username: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

// ─── 수정 모달 ───────────────────────────────────────────
function EditUserModal({
  target,
  onClose,
  onSaved,
  currentAdminId,
}: {
  target: UserItem;
  onClose: () => void;
  onSaved: (updated: UserItem) => void;
  currentAdminId: string;
}) {
  const [form, setForm] = useState({
    name: target.name ?? '',
    email: target.email,
    phone: target.phone ?? '',
    address: target.address ?? '',
    role: target.role,
  });
  const [saving, setSaving] = useState(false);
  const isSelf = target.id === currentAdminId;

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.email.trim()) { toast.error('이메일을 입력해주세요.'); return; }
    setSaving(true);
    try {
      const updated = await api.patch<UserItem>(`/users/${target.id}`, {
        name: form.name || undefined,
        email: form.email,
        phone: form.phone || undefined,
        address: form.address || undefined,
        role: form.role,
      });
      onSaved(updated);
      toast.success('회원 정보를 수정했습니다.');
    } catch (e: any) {
      toast.error(e.message ?? '수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {(target.name || target.username).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{target.name || target.username}</p>
              <p className="text-xs text-gray-400">@{target.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 이름
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="이름 입력"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> 이메일
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* 아이디 (읽기 전용) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5" /> 아이디 <span className="text-gray-300 font-normal">(변경 불가)</span>
            </label>
            <input
              type="text"
              value={target.username}
              readOnly
              className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-default"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> 전화번호
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> 주소
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="주소 입력"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* 등급 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> 등급
              {isSelf && <span className="text-amber-500 font-normal">(본인 등급 변경 주의)</span>}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => set('role', 'USER')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.role === 'USER'
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                <User className="w-4 h-4" /> 일반 회원
              </button>
              <button
                onClick={() => set('role', 'ADMIN')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.role === 'ADMIN'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'
                }`}
              >
                <Crown className="w-4 h-4" /> 관리자
              </button>
            </div>
          </div>

          {/* 저장 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 mt-2"
          >
            {saving ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────
export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) { router.push('/'); return; }
    if (user) {
      api.get<UserItem[]>('/users')
        .then(setUsers)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user, loading]);

  if (loading || !user) return null;

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || '').includes(search) ||
      (u.phone || '').includes(search);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleSaved = (updated: UserItem) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setEditTarget(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">회원 관리</h1>
            <p className="text-sm text-gray-400 mt-0.5">총 {users.length}명</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '전체 회원', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: '일반 회원', value: users.filter(u => u.role === 'USER').length, icon: User, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: '관리자', value: users.filter(u => u.role === 'ADMIN').length, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 ${c.bg} rounded-lg flex items-center justify-center`}>
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <span className="text-xs text-gray-400">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            </div>
          ))}
        </div>

        {/* 검색 + 필터 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="이름, 아이디, 이메일, 전화번호 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex gap-1.5">
            {(['ALL', 'USER', 'ADMIN'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  roleFilter === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {r === 'ALL' ? '전체' : r === 'USER' ? '일반' : '관리자'}
              </button>
            ))}
          </div>
        </div>

        {/* 회원 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">{search ? '검색 결과가 없습니다.' : '회원이 없습니다.'}</p>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">회원</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">이메일</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">전화번호</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400">등급</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400">가입일</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              u.role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {(u.name || u.username).slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{u.name || <span className="text-gray-400">-</span>}</p>
                              <p className="text-xs text-gray-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-sm">{u.email}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-sm">{u.phone || <span className="text-gray-300">-</span>}</td>
                        <td className="px-5 py-3.5 text-center">
                          {u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Crown className="w-3 h-3" /> 관리자
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                              <User className="w-3 h-3" /> 일반
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setEditTarget(u)}
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map(u => (
                  <div key={u.id} className="px-4 py-3.5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      u.role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {(u.name || u.username).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">{u.name || u.username}</p>
                        {u.role === 'ADMIN' && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                    </div>
                    <button
                      onClick={() => setEditTarget(u)}
                      className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
                {filtered.length}명 표시 중 (전체 {users.length}명)
              </div>
            </>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
      {editTarget && (
        <EditUserModal
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
          currentAdminId={user.id}
        />
      )}
    </div>
  );
}
