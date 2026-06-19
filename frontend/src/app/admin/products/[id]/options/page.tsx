'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, X, Check, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ProductOptionGroup, ProductOption } from '@/lib/types';
import { toast } from 'sonner';

export default function ProductOptionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [productName, setProductName] = useState('');
  const [groups, setGroups] = useState<ProductOptionGroup[]>([]);
  const [fetching, setFetching] = useState(true);

  // 그룹 추가 폼
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRequired, setNewGroupRequired] = useState(true);

  // 옵션 추가 상태 (groupId별)
  const [newOption, setNewOption] = useState<Record<string, { name: string; price: string }>>({});

  // 인라인 수정 상태
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string; required: boolean } | null>(null);
  const [editingOption, setEditingOption] = useState<{ id: string; name: string; price: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [user, loading]);

  const load = async () => {
    setFetching(true);
    try {
      const [prod, grps] = await Promise.all([
        api.get<any>(`/products/${productId}`).catch(() => null),
        api.get<ProductOptionGroup[]>(`/products/${productId}/option-groups`),
      ]);
      if (prod) setProductName(prod.name);
      setGroups(grps);
    } catch {
      toast.error('불러오기 실패');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { if (productId) load(); }, [productId]);

  // ── 그룹 CRUD ──────────────────────────────────────────
  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await api.post(`/products/${productId}/option-groups`, {
        name: newGroupName.trim(), required: newGroupRequired, order: groups.length,
      });
      setNewGroupName('');
      load();
      toast.success('옵션 그룹 추가됨');
    } catch { toast.error('추가 실패'); }
  };

  const saveGroup = async () => {
    if (!editingGroup) return;
    try {
      await api.patch(`/products/${productId}/option-groups/groups/${editingGroup.id}`, {
        name: editingGroup.name, required: editingGroup.required,
      });
      setEditingGroup(null);
      load();
    } catch { toast.error('수정 실패'); }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('이 옵션 그룹과 모든 옵션을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/products/${productId}/option-groups/groups/${groupId}`);
      load();
      toast.success('삭제됨');
    } catch { toast.error('삭제 실패'); }
  };

  const moveGroup = async (idx: number, dir: -1 | 1) => {
    const a = groups[idx], b = groups[idx + dir];
    if (!b) return;
    await Promise.all([
      api.patch(`/products/${productId}/option-groups/groups/${a.id}`, { order: b.order }),
      api.patch(`/products/${productId}/option-groups/groups/${b.id}`, { order: a.order }),
    ]);
    load();
  };

  // ── 옵션 CRUD ──────────────────────────────────────────
  const addOption = async (groupId: string) => {
    const opt = newOption[groupId];
    if (!opt?.name?.trim()) return;
    try {
      await api.post(`/products/${productId}/option-groups/groups/${groupId}/options`, {
        name: opt.name.trim(),
        price: Number(opt.price) || 0,
        order: groups.find(g => g.id === groupId)?.options.length ?? 0,
      });
      setNewOption(prev => ({ ...prev, [groupId]: { name: '', price: '' } }));
      load();
    } catch { toast.error('옵션 추가 실패'); }
  };

  const saveOption = async (groupId: string) => {
    if (!editingOption) return;
    try {
      await api.patch(
        `/products/${productId}/option-groups/groups/${groupId}/options/${editingOption.id}`,
        { name: editingOption.name, price: Number(editingOption.price) || 0 },
      );
      setEditingOption(null);
      load();
    } catch { toast.error('수정 실패'); }
  };

  const deleteOption = async (groupId: string, optionId: string) => {
    try {
      await api.delete(`/products/${productId}/option-groups/groups/${groupId}/options/${optionId}`);
      load();
    } catch { toast.error('삭제 실패'); }
  };

  if (loading || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 block mb-1">상품 목록</Link>
        <h1 className="text-2xl font-bold text-gray-900">옵션 관리</h1>
        {productName && <p className="text-sm text-gray-500 mt-1">{productName}</p>}
      </div>

      {/* 그룹 추가 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">옵션 그룹 추가</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs text-gray-500 mb-1 block">그룹 이름 (예: 모니터링팩, 색상, 용량)</Label>
            <Input
              placeholder="그룹 이름 입력"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGroup()}
            />
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => setNewGroupRequired(v => !v)}
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${newGroupRequired ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${newGroupRequired ? 'left-4' : 'left-0.5'}`} />
            </button>
            <span className="text-xs text-gray-600 whitespace-nowrap">필수</span>
          </div>
          <Button onClick={addGroup} className="bg-blue-600 hover:bg-blue-700 gap-1 shrink-0">
            <Plus className="w-4 h-4" /> 추가
          </Button>
        </div>
      </div>

      {/* 그룹 목록 */}
      {fetching ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-16 text-gray-400">
          <p className="font-medium">등록된 옵션 그룹이 없습니다.</p>
          <p className="text-sm mt-1">위에서 그룹을 먼저 추가하세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={group.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* 그룹 헤더 */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                {editingGroup?.id === group.id ? (
                  <>
                    <Input
                      className="h-8 text-sm flex-1"
                      value={editingGroup.name}
                      onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    />
                    <button
                      onClick={() => setEditingGroup({ ...editingGroup, required: !editingGroup.required })}
                      className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${editingGroup.required ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${editingGroup.required ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <span className="text-xs text-gray-500">필수</span>
                    <button onClick={saveGroup} className="p-1 text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingGroup(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-sm text-gray-900 flex-1">{group.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${group.required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      {group.required ? '필수' : '선택'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => moveGroup(gi, -1)} disabled={gi === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveGroup(gi, 1)} disabled={gi === groups.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingGroup({ id: group.id, name: group.name, required: group.required })} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteGroup(group.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </>
                )}
              </div>

              {/* 옵션 목록 */}
              <div className="divide-y divide-gray-50">
                {group.options.map(opt => (
                  <div key={opt.id} className="flex items-center gap-3 px-4 py-2.5">
                    {editingOption?.id === opt.id ? (
                      <>
                        <Input className="h-7 text-sm flex-1" value={editingOption.name} onChange={e => setEditingOption({ ...editingOption, name: e.target.value })} />
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-400">+</span>
                          <Input className="h-7 text-sm w-24" type="number" value={editingOption.price} onChange={e => setEditingOption({ ...editingOption, price: e.target.value })} />
                          <span className="text-xs text-gray-400">원</span>
                        </div>
                        <button onClick={() => saveOption(group.id)} className="p-1 text-blue-600"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingOption(null)} className="p-1 text-gray-400"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-gray-800 flex-1">{opt.name}</span>
                        <span className="text-sm text-gray-500 shrink-0">
                          {opt.price > 0 ? `+${opt.price.toLocaleString()}원` : opt.price < 0 ? `${opt.price.toLocaleString()}원` : '기본'}
                        </span>
                        <button onClick={() => setEditingOption({ id: opt.id, name: opt.name, price: String(opt.price) })} className="p-1 text-gray-300 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteOption(group.id, opt.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                ))}

                {/* 옵션 추가 행 */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/50">
                  <Input
                    className="h-8 text-sm flex-1"
                    placeholder="옵션명 (예: 없음, 블루투스 추가)"
                    value={newOption[group.id]?.name ?? ''}
                    onChange={e => setNewOption(prev => ({ ...prev, [group.id]: { ...prev[group.id], name: e.target.value } }))}
                    onKeyDown={e => e.key === 'Enter' && addOption(group.id)}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-400">+</span>
                    <Input
                      className="h-8 text-sm w-24"
                      type="number"
                      placeholder="0"
                      value={newOption[group.id]?.price ?? ''}
                      onChange={e => setNewOption(prev => ({ ...prev, [group.id]: { ...prev[group.id], price: e.target.value } }))}
                      onKeyDown={e => e.key === 'Enter' && addOption(group.id)}
                    />
                    <span className="text-xs text-gray-400">원</span>
                  </div>
                  <button
                    onClick={() => addOption(group.id)}
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
