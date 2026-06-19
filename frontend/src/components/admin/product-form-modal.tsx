'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, Pencil, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { Product, Category, ProductOptionGroup } from '@/lib/types';
import { toast } from 'sonner';

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ── 이미지 업로드 그리드 ─────────────────────────────────────
function ImageUploadGrid({ urls, folder, onChange, label, hint }: {
  urls: string[]; folder: string; onChange: (urls: string[]) => void; label: string; hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - urls.length;
    if (remaining <= 0) { toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 추가할 수 있습니다.`); return; }
    const selected = Array.from(files).slice(0, remaining);
    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE) { toast.error(`${f.name}: 파일 크기가 5MB를 초과합니다.`); return; }
    }
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const f of selected) newUrls.push(await uploadImage(f, folder));
      onChange([...urls, ...newUrls]);
      toast.success(`${newUrls.length}장 업로드 완료`);
    } catch (err: any) {
      toast.error(err.message || '업로드 실패');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <Label className="flex items-center justify-between mb-1.5">
        <span>{label}</span>
        {hint && <span className="text-xs text-gray-400 font-normal">{hint}</span>}
      </Label>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
            {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-blue-600 text-white py-0.5">대표</span>}
          </div>
        ))}
        {urls.length < MAX_IMAGES && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50">
            {uploading ? <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <><Plus className="w-5 h-5" /><span className="text-[10px]">추가</span></>}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" multiple className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />
      <p className="mt-1.5 text-xs text-gray-400">JPG·PNG·WebP·GIF / 파일당 최대 5MB / 최대 {MAX_IMAGES}장 / 자동 WebP 압축</p>
    </div>
  );
}

// ── 옵션 관리 탭 ─────────────────────────────────────────────
function OptionsTab({ productId }: { productId: string }) {
  const [groups, setGroups] = useState<ProductOptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRequired, setNewGroupRequired] = useState(true);
  const [newOption, setNewOption] = useState<Record<string, { name: string; price: string }>>({});
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string; required: boolean } | null>(null);
  const [editingOption, setEditingOption] = useState<{ id: string; groupId: string; name: string; price: string } | null>(null);

  const load = async () => {
    try {
      const data = await api.get<ProductOptionGroup[]>(`/products/${productId}/option-groups`);
      setGroups(data);
    } catch { toast.error('옵션 불러오기 실패'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [productId]);

  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await api.post(`/products/${productId}/option-groups`, { name: newGroupName.trim(), required: newGroupRequired, order: groups.length });
      setNewGroupName('');
      toast.success('옵션 그룹 추가됨');
      load();
    } catch { toast.error('추가 실패'); }
  };

  const saveGroup = async () => {
    if (!editingGroup) return;
    try {
      await api.patch(`/products/${productId}/option-groups/groups/${editingGroup.id}`, { name: editingGroup.name, required: editingGroup.required });
      setEditingGroup(null);
      load();
    } catch { toast.error('수정 실패'); }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('이 옵션 그룹과 모든 옵션을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/products/${productId}/option-groups/groups/${groupId}`);
      toast.success('삭제됨');
      load();
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

  const addOption = async (groupId: string) => {
    const opt = newOption[groupId];
    if (!opt?.name?.trim()) return;
    try {
      await api.post(`/products/${productId}/option-groups/groups/${groupId}/options`, {
        name: opt.name.trim(), price: Number(opt.price) || 0,
        order: groups.find(g => g.id === groupId)?.options.length ?? 0,
      });
      setNewOption(prev => ({ ...prev, [groupId]: { name: '', price: '' } }));
      load();
    } catch { toast.error('옵션 추가 실패'); }
  };

  const saveOption = async () => {
    if (!editingOption) return;
    try {
      await api.patch(
        `/products/${productId}/option-groups/groups/${editingOption.groupId}/options/${editingOption.id}`,
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

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* 그룹 추가 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-500 mb-2">새 옵션 그룹 추가 (예: 색상, 용량, 모니터링팩)</p>
        <div className="flex gap-2 items-center">
          <Input
            className="h-9 text-sm flex-1"
            placeholder="그룹 이름"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGroup()}
          />
          <button type="button" onClick={() => setNewGroupRequired(v => !v)}
            className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${newGroupRequired ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${newGroupRequired ? 'left-4' : 'left-0.5'}`} />
          </button>
          <span className="text-xs text-gray-500 whitespace-nowrap">필수</span>
          <button type="button" onClick={addGroup}
            className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1 shrink-0">
            <Plus className="w-3.5 h-3.5" /> 추가
          </button>
        </div>
      </div>

      {/* 그룹 목록 */}
      {groups.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">등록된 옵션 그룹이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group, gi) => (
            <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* 그룹 헤더 */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                {editingGroup?.id === group.id ? (
                  <>
                    <Input className="h-7 text-sm flex-1" value={editingGroup.name}
                      onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })} />
                    <button type="button" onClick={() => setEditingGroup({ ...editingGroup, required: !editingGroup.required })}
                      className={`w-7 h-4 rounded-full transition-colors relative shrink-0 ${editingGroup.required ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${editingGroup.required ? 'left-3.5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-xs text-gray-500">필수</span>
                    <button type="button" onClick={saveGroup} className="p-1 text-blue-600 hover:text-blue-800"><Check className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setEditingGroup(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-sm text-gray-900 flex-1">{group.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${group.required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      {group.required ? '필수' : '선택'}
                    </span>
                    <button type="button" onClick={() => moveGroup(gi, -1)} disabled={gi === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveGroup(gi, 1)} disabled={gi === groups.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => setEditingGroup({ id: group.id, name: group.name, required: group.required })} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => deleteGroup(group.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>

              {/* 옵션 목록 */}
              <div className="divide-y divide-gray-50">
                {group.options.map(opt => (
                  <div key={opt.id} className="flex items-center gap-2 px-3 py-2">
                    {editingOption?.id === opt.id ? (
                      <>
                        <Input className="h-7 text-sm flex-1" value={editingOption.name}
                          onChange={e => setEditingOption({ ...editingOption, name: e.target.value })} />
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-400">+</span>
                          <Input className="h-7 text-sm w-20" type="number" value={editingOption.price}
                            onChange={e => setEditingOption({ ...editingOption, price: e.target.value })} />
                          <span className="text-xs text-gray-400">원</span>
                        </div>
                        <button type="button" onClick={saveOption} className="p-1 text-blue-600"><Check className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => setEditingOption(null)} className="p-1 text-gray-400"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-gray-800 flex-1">{opt.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">
                          {opt.price > 0 ? `+${opt.price.toLocaleString()}원` : opt.price < 0 ? `${opt.price.toLocaleString()}원` : '기본가'}
                        </span>
                        <button type="button" onClick={() => setEditingOption({ id: opt.id, groupId: group.id, name: opt.name, price: String(opt.price) })} className="p-1 text-gray-300 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                        <button type="button" onClick={() => deleteOption(group.id, opt.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </>
                    )}
                  </div>
                ))}

                {/* 옵션 추가 행 */}
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/40">
                  <Input className="h-7 text-sm flex-1" placeholder="옵션명 (예: 없음, 블루투스 추가)"
                    value={newOption[group.id]?.name ?? ''}
                    onChange={e => setNewOption(prev => ({ ...prev, [group.id]: { ...prev[group.id], name: e.target.value } }))}
                    onKeyDown={e => e.key === 'Enter' && addOption(group.id)} />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-400">+</span>
                    <Input className="h-7 text-sm w-20" type="number" placeholder="0"
                      value={newOption[group.id]?.price ?? ''}
                      onChange={e => setNewOption(prev => ({ ...prev, [group.id]: { ...prev[group.id], price: e.target.value } }))}
                      onKeyDown={e => e.key === 'Enter' && addOption(group.id)} />
                    <span className="text-xs text-gray-400">원</span>
                  </div>
                  <button type="button" onClick={() => addOption(group.id)}
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shrink-0">
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

// ── 메인 모달 ─────────────────────────────────────────────────
interface Props {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductFormModal({ product, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<'info' | 'options'>('info');
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '', slug: `prod-${Date.now()}`, description: '', price: '', stock: '',
    categoryId: '', isActive: true,
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [detailImageUrls, setDetailImageUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
    if (product) {
      setForm({
        name: product.name, slug: product.slug,
        description: product.description || '',
        price: String(product.price), stock: String(product.stock),
        categoryId: product.categoryId, isActive: product.isActive,
      });
      setImageUrls(product.imageUrls);
      setDetailImageUrls(product.detailImageUrls);
    }
  }, [product]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error('카테고리를 선택해주세요.'); return; }
    if (!form.name.trim()) { toast.error('상품명을 입력해주세요.'); return; }

    if (!form.price || Number(form.price) < 0) { toast.error('올바른 가격을 입력해주세요.'); return; }
    if (form.stock === '' || Number(form.stock) < 0) { toast.error('올바른 재고 수량을 입력해주세요.'); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name, slug: form.slug,
        description: form.description || undefined,
        price: Number(form.price), stock: Number(form.stock),
        imageUrls, detailImageUrls,
        categoryId: form.categoryId, isActive: form.isActive,
      };
      if (product) {
        await api.patch(`/products/${product.id}`, data);
        toast.success('상품이 수정되었습니다.');
      } else {
        await api.post('/products', data);
        toast.success('상품이 등록되었습니다. 수정 화면에서 옵션을 추가할 수 있습니다.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0 shrink-0">
          <h2 className="font-bold text-gray-900">{product ? '상품 수정' : '상품 등록'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* 탭 (수정 시에만) */}
        {product && (
          <div className="flex gap-0 px-5 mt-4 border-b border-gray-100 shrink-0">
            {(['info', 'options'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`pb-2.5 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t === 'info' ? '기본 정보' : '옵션 관리'}
              </button>
            ))}
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="overflow-y-auto flex-1">
          {tab === 'info' ? (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <Label>카테고리 *</Label>
                <select value={form.categoryId} onChange={update('categoryId')}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">카테고리 선택</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label>상품명 *</Label>
                <Input value={form.name} onChange={update('name')} className="mt-1" />
              </div>
              <div>
                <Label>상품번호</Label>
                <Input value={form.slug} readOnly className="mt-1 bg-gray-50 text-gray-500 cursor-default" />
              </div>
              <div>
                <Label>설명</Label>
                <Textarea value={form.description} onChange={update('description')} className="mt-1" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>가격 (원) *</Label>
                  <Input type="number" value={form.price} onChange={update('price')} min={0} className="mt-1" />
                </div>
                <div>
                  <Label>재고 *</Label>
                  <Input type="number" value={form.stock} onChange={update('stock')} min={0} className="mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-5' : 'left-1'}`} />
                </button>
                <span className="text-sm text-gray-700">판매 활성화</span>
              </div>
              <ImageUploadGrid urls={imageUrls} folder="products" onChange={setImageUrls} label="메인 이미지" hint="첫 번째가 대표 이미지" />
              <ImageUploadGrid urls={detailImageUrls} folder="products/detail" onChange={setDetailImageUrls} label="상세 이미지" hint="상품 상세 페이지에 표시" />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>취소</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                  {saving ? '저장 중...' : product ? '수정' : '등록'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-5">
              {product && <OptionsTab productId={product.id} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
