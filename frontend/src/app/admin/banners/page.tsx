'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus, Trash2, Eye, EyeOff,
  ChevronUp, ChevronDown, Pencil, X, Check, ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { Banner } from '@/lib/types';
import { toast } from 'sonner';

interface FormState {
  imageUrl: string;
  linkUrl: string;
  title: string;
  subtitle: string;
  isActive: boolean;
}

const EMPTY: FormState = { imageUrl: '', linkUrl: '', title: '', subtitle: '', isActive: true };

export default function AdminBannersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const url = await uploadImage(files[0], 'banners');
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success('이미지 업로드 완료');
    } catch (err: any) {
      toast.error(err.message || '업로드 실패');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [user, loading]);

  const load = () => {
    setFetching(true);
    api.get<Banner[]>('/banners/all')
      .then(setBanners)
      .catch(() => toast.error('배너 목록을 불러오지 못했습니다.'))
      .finally(() => setFetching(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (b: Banner) => {
    setEditId(b.id);
    setForm({ imageUrl: b.imageUrl, linkUrl: b.linkUrl || '', title: b.title || '', subtitle: b.subtitle || '', isActive: b.isActive });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.imageUrl.trim()) { toast.error('이미지를 업로드해주세요.'); return; }
    setSaving(true);
    try {
      const payload = {
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim() || null,
        title: form.title.trim() || null,
        subtitle: form.subtitle.trim() || null,
        isActive: form.isActive,
        order: editId ? undefined : banners.length,
      };
      if (editId) {
        await api.patch(`/banners/${editId}`, payload);
        toast.success('배너가 수정되었습니다.');
      } else {
        await api.post('/banners', payload);
        toast.success('배너가 등록되었습니다.');
      }
      closeForm();
      load();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 배너를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/banners/${id}`);
      toast.success('삭제되었습니다.');
      load();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const toggleActive = async (b: Banner) => {
    try {
      await api.patch(`/banners/${b.id}`, { isActive: !b.isActive });
      setBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, isActive: !b.isActive } : x));
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const moveOrder = async (idx: number, dir: -1 | 1) => {
    const target = banners[idx];
    const swap = banners[idx + dir];
    if (!swap) return;
    try {
      await Promise.all([
        api.patch(`/banners/${target.id}`, { order: swap.order }),
        api.patch(`/banners/${swap.id}`, { order: target.order }),
      ]);
      load();
    } catch {
      toast.error('순서 변경에 실패했습니다.');
    }
  };

  if (loading || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 mb-1 block">← 관리자 홈</Link>
          <h1 className="text-2xl font-bold text-gray-900">배너 관리</h1>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" /> 배너 추가
        </Button>
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{editId ? '배너 수정' : '새 배너 등록'}</h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">배너 이미지 <span className="text-red-500">*</span></Label>
              {form.imageUrl ? (
                <div className="relative w-full rounded-xl overflow-hidden bg-gray-100 group" style={{ aspectRatio: '16/5' }}>
                  <Image src={form.imageUrl} alt="미리보기" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    이미지 변경
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                  style={{ aspectRatio: '16/5' }}
                >
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm">클릭하여 배너 이미지 업로드</span>
                      <span className="text-xs">JPG·PNG·WebP / 최대 5MB / 자동 WebP 압축</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleBannerImage(e.target.files)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">제목 (선택)</Label>
              <Input
                placeholder="배너 제목"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">부제목 (선택)</Label>
              <Input
                placeholder="배너 부제목"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">클릭 링크 (선택)</Label>
              <Input
                placeholder="/products 또는 https://..."
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-5' : 'left-1'}`} />
              </button>
              <span className="text-sm text-gray-700">활성화</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeForm}>취소</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
              <Check className="w-4 h-4" /> {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}

      {/* 배너 목록 */}
      {fetching ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="font-medium">등록된 배너가 없습니다.</p>
          <p className="text-sm mt-1">배너 추가 버튼을 눌러 첫 번째 배너를 등록해주세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => (
            <div key={b.id} className={`bg-white rounded-2xl border p-4 flex gap-4 items-center ${b.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
              {/* 미리보기 */}
              <div className="relative w-36 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <Image src={b.imageUrl} alt={b.title || ''} fill className="object-cover" />
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.isActive ? '활성' : '비활성'}
                  </span>
                  <span className="text-xs text-gray-400">순서 {b.order + 1}</span>
                </div>
                <p className="font-medium text-gray-900 truncate">{b.title || '(제목 없음)'}</p>
                {b.subtitle && <p className="text-sm text-gray-500 truncate">{b.subtitle}</p>}
                {b.linkUrl && <p className="text-xs text-blue-500 truncate mt-0.5">{b.linkUrl}</p>}
              </div>

              {/* 액션 */}
              <div className="flex items-center gap-1 shrink-0">
                {/* 순서 변경 */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveOrder(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  ><ChevronUp className="w-4 h-4" /></button>
                  <button
                    onClick={() => moveOrder(idx, 1)}
                    disabled={idx === banners.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  ><ChevronDown className="w-4 h-4" /></button>
                </div>
                {/* 활성 토글 */}
                <button
                  onClick={() => toggleActive(b)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title={b.isActive ? '비활성화' : '활성화'}
                >
                  {b.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {/* 수정 */}
                <button
                  onClick={() => openEdit(b)}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                ><Pencil className="w-4 h-4" /></button>
                {/* 삭제 */}
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                ><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
