'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Tag, ChevronUp, ChevronDown, Pencil, Check, X, Save, RotateCcw, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';

interface EditForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export default function AdminCategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [originalOrder, setOriginalOrder] = useState<Category[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', slug: '', description: '', imageUrl: '' });
  const [editSaving, setEditSaving] = useState(false);

  const load = () =>
    api.get<Category[]>('/categories').then((data) => {
      setCategories(data);
      setOriginalOrder(data);
      setOrderChanged(false);
    }).catch(() => {});

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) { router.push('/'); return; }
    if (user) load();
  }, [user, loading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    target === 'create' ? setUploading(true) : setEditUploading(true);
    try {
      const url = await uploadImage(file, 'categories');
      if (target === 'create') setForm(f => ({ ...f, imageUrl: url }));
      else setEditForm(f => ({ ...f, imageUrl: url }));
    } catch (err: any) {
      toast.error(err.message ?? '이미지 업로드 실패');
    } finally {
      target === 'create' ? setUploading(false) : setEditUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('카테고리 이름을 입력해주세요.'); return; }
    if (!form.slug.trim()) { toast.error('슬러그를 입력해주세요.'); return; }
    setSaving(true);
    try {
      await api.post('/categories', { ...form, imageUrl: form.imageUrl || null });
      toast.success('카테고리가 등록되었습니다.');
      setForm({ name: '', slug: '', description: '', imageUrl: '' });
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('카테고리를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('삭제되었습니다.');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditForm({ name: c.name, slug: c.slug, description: c.description ?? '', imageUrl: c.imageUrl ?? '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', slug: '', description: '', imageUrl: '' });
  };

  const handleEditSave = async (id: string) => {
    if (!editForm.name.trim()) { toast.error('이름을 입력해주세요.'); return; }
    if (!editForm.slug.trim()) { toast.error('슬러그를 입력해주세요.'); return; }
    setEditSaving(true);
    try {
      await api.patch(`/categories/${id}`, { ...editForm, imageUrl: editForm.imageUrl || null });
      toast.success('수정되었습니다.');
      setEditingId(null);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setEditSaving(false); }
  };

  // 순서를 로컬에서만 변경
  const move = (index: number, direction: 'up' | 'down') => {
    const next = direction === 'up' ? index - 1 : index + 1;
    if (next < 0 || next >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setCategories(reordered);
    setOrderChanged(true);
  };

  // 순서 저장 확정
  const handleSaveOrder = async () => {
    setOrderSaving(true);
    try {
      const items = categories.map((c, i) => ({ id: c.id, order: i }));
      await api.patch('/categories/reorder', { items });
      setOriginalOrder(categories);
      setOrderChanged(false);
      toast.success('순서가 저장되었습니다.');
    } catch {
      toast.error('순서 저장에 실패했습니다.');
    } finally {
      setOrderSaving(false);
    }
  };

  // 순서 되돌리기
  const handleResetOrder = () => {
    setCategories(originalOrder);
    setOrderChanged(false);
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">관리자 홈</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">카테고리 관리</h1>
      </div>

      {/* 등록 폼 */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">카테고리 등록</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">이름 *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="리튬 배터리"
                className="mt-1"
                onBlur={() => {
                  if (!form.slug && form.name)
                    setForm((f) => ({ ...f, slug: form.name.toLowerCase().replace(/\s+/g, '-') }));
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">슬러그 *</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="lithium"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">설명</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="카테고리 설명"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">카테고리 이미지 <span className="text-gray-400 font-normal">(선택)</span></label>
            <div className="mt-1 flex items-center gap-3">
              {form.imageUrl ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 shrink-0">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'create')} disabled={uploading} />
                  <ImageIcon className="w-5 h-5 text-gray-300" />
                  <span className="text-[10px] text-gray-400 mt-0.5">{uploading ? '...' : '업로드'}</span>
                </label>
              )}
              <p className="text-xs text-gray-400">없으면 기본 아이콘이 표시됩니다</p>
            </div>
          </div>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
            <Plus className="w-4 h-4 mr-1" />{saving ? '등록 중...' : '등록'}
          </Button>
        </form>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">
            총 {categories.length}개
            {!orderChanged && (
              <span className="text-xs text-gray-400 ml-2 font-normal">▲▼ 버튼으로 순서 조정 후 저장</span>
            )}
          </p>

          {/* 순서 변경 중일 때만 저장/취소 버튼 표시 */}
          {orderChanged && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-medium">순서가 변경됐습니다</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 border-gray-300 text-gray-500"
                onClick={handleResetOrder}
                disabled={orderSaving}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                되돌리기
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveOrder}
                disabled={orderSaving}
              >
                <Save className="w-3 h-3 mr-1" />
                {orderSaving ? '저장 중...' : '순서 저장'}
              </Button>
            </div>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">카테고리가 없습니다.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((c, index) => (
              <li key={c.id}>
                {editingId === c.id ? (
                  /* 인라인 수정 폼 */
                  <div className="px-4 py-3 bg-blue-50 border-l-2 border-blue-400 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500">이름 *</label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="mt-0.5 h-8 text-sm"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">슬러그 *</label>
                        <Input
                          value={editForm.slug}
                          onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                          className="mt-0.5 h-8 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">설명</label>
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="mt-0.5 h-8 text-sm"
                        placeholder="(선택)"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">이미지</label>
                      <div className="mt-0.5 flex items-center gap-2">
                        {editForm.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                            <img src={editForm.imageUrl} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setEditForm(f => ({ ...f, imageUrl: '' }))}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 shrink-0">
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'edit')} disabled={editUploading} />
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-[9px] text-gray-400">{editUploading ? '...' : '업로드'}</span>
                          </label>
                        )}
                        <p className="text-xs text-gray-400">없으면 기본 아이콘</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-7 bg-blue-600 hover:bg-blue-700 text-xs px-3"
                        onClick={() => handleEditSave(c.id)}
                        disabled={editSaving}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {editSaving ? '저장 중...' : '저장'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-3"
                        onClick={cancelEdit}
                        disabled={editSaving}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* 일반 행 */
                  <div className={`flex items-center gap-2 px-4 py-3 transition-colors ${orderChanged ? 'hover:bg-amber-50' : 'hover:bg-gray-50'}`}>
                    <span className="text-xs text-gray-300 w-5 text-center shrink-0">{index + 1}</span>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.slug}</p>
                    </div>

                    <span className="text-xs text-gray-400 shrink-0">{c._count?.products ?? 0}개</span>

                    {/* 순서 변경 */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => move(index, 'up')}
                        disabled={index === 0 || editingId !== null}
                        className="w-6 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => move(index, 'down')}
                        disabled={index === categories.length - 1 || editingId !== null}
                        className="w-6 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 수정 */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 shrink-0"
                      onClick={() => startEdit(c)}
                      disabled={orderChanged}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>

                    {/* 삭제 */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => handleDelete(c.id)}
                      disabled={orderChanged}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
