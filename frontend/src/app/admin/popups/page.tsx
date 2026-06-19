'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, ImageIcon,
  ToggleLeft, ToggleRight, CalendarRange, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Popup } from '@/lib/types';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';

// ─── 날짜 포맷 ───────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function toInputDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 16);
}

// ─── 폼 초기값 ────────────────────────────────────────────
const EMPTY_FORM = {
  title: '',
  imageUrl: '',
  content: '',
  linkUrl: '',
  isActive: true,
  startAt: '',
  endAt: '',
};

// ─── 팝업 폼 모달 ─────────────────────────────────────────
function PopupFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Popup | null;
  onSave: (popup: Popup) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    imageUrl: initial?.imageUrl ?? '',
    content: initial?.content ?? '',
    linkUrl: initial?.linkUrl ?? '',
    isActive: initial?.isActive ?? true,
    startAt: toInputDate(initial?.startAt ?? null),
    endAt: toInputDate(initial?.endAt ?? null),
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'popups');
      set('imageUrl', url);
    } catch (err: any) {
      toast.error(err.message ?? '이미지 업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        imageUrl: form.imageUrl || undefined,
        content: form.content || undefined,
        linkUrl: form.linkUrl || undefined,
        isActive: form.isActive,
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
      };
      const result = initial
        ? await api.patch<Popup>(`/popups/${initial.id}`, payload)
        : await api.post<Popup>('/popups', payload);
      onSave(result);
      toast.success(initial ? '팝업을 수정했습니다.' : '팝업을 등록했습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-gray-900">{initial ? '팝업 수정' : '새 팝업 등록'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">제목 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="관리자 식별용 제목"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">팝업 이미지</label>
            {form.imageUrl ? (
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image src={form.imageUrl} alt="팝업 이미지" fill className="object-cover" />
                <button
                  onClick={() => set('imageUrl', '')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-sm text-gray-400">{uploading ? '업로드 중...' : '이미지를 클릭하여 업로드'}</span>
                <span className="text-xs text-gray-300 mt-1">권장 비율 4:3</span>
              </label>
            )}
          </div>

          {/* 텍스트 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">텍스트 내용 <span className="text-gray-400 font-normal">(선택)</span></label>
            <textarea
              rows={3}
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="이미지 아래에 표시될 텍스트"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* 링크 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> 클릭 시 이동할 링크 <span className="text-gray-400 font-normal">(선택)</span></span>
            </label>
            <input
              type="text"
              value={form.linkUrl}
              onChange={e => set('linkUrl', e.target.value)}
              placeholder="https://... 또는 /products"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* 노출 기간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> 노출 기간 <span className="text-gray-400 font-normal">(비우면 항상 표시)</span></span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={e => set('startAt', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              />
              <span className="text-gray-400 text-sm shrink-0">~</span>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={e => set('endAt', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* 활성화 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800">팝업 활성화</p>
              <p className="text-xs text-gray-400 mt-0.5">비활성화하면 메인 화면에 표시되지 않습니다</p>
            </div>
            <button onClick={() => set('isActive', !form.isActive)} className="ml-4">
              {form.isActive
                ? <ToggleRight className="w-9 h-9 text-blue-600" />
                : <ToggleLeft className="w-9 h-9 text-gray-300" />}
            </button>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : initial ? '수정 완료' : '팝업 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────
export default function AdminPopupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editTarget, setEditTarget] = useState<Popup | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Popup | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [user, loading]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get<Popup[]>('/popups/all')
        .then(setPopups)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user]);

  const handleSave = (saved: Popup) => {
    setPopups(prev => {
      const exists = prev.find(p => p.id === saved.id);
      return exists ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev];
    });
    setEditTarget(undefined);
  };

  const handleToggleActive = async (popup: Popup) => {
    try {
      const updated = await api.patch<Popup>(`/popups/${popup.id}`, { isActive: !popup.isActive });
      setPopups(prev => prev.map(p => p.id === updated.id ? updated : p));
      toast.success(updated.isActive ? '팝업을 활성화했습니다.' : '팝업을 비활성화했습니다.');
    } catch {
      toast.error('변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/popups/${deleteTarget.id}`);
      setPopups(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('팝업을 삭제했습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user || user.role !== 'ADMIN') return null;

  const now = new Date();
  const getStatus = (popup: Popup) => {
    if (!popup.isActive) return { label: '비활성', color: 'text-gray-400', bg: 'bg-gray-100' };
    if (popup.startAt && new Date(popup.startAt) > now) return { label: '예정', color: 'text-amber-700', bg: 'bg-amber-50' };
    if (popup.endAt && new Date(popup.endAt) < now) return { label: '종료', color: 'text-gray-400', bg: 'bg-gray-100' };
    return { label: '표시 중', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">팝업 관리</h1>
                <p className="text-sm text-gray-400 mt-0.5">메인 화면 팝업을 등록하고 관리하세요</p>
              </div>
            </div>
            <button
              onClick={() => setEditTarget(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> 팝업 등록
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : popups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">등록된 팝업이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">새 팝업을 등록해보세요.</p>
            <button
              onClick={() => setEditTarget(null)}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> 첫 팝업 등록하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popups.map(popup => {
              const st = getStatus(popup);
              return (
                <div key={popup.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                  {/* 이미지 미리보기 */}
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    {popup.imageUrl ? (
                      <Image src={popup.imageUrl} alt={popup.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon className="w-10 h-10 mb-2" />
                        <p className="text-xs">이미지 없음</p>
                      </div>
                    )}
                    {/* 상태 뱃지 */}
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${st.color} ${st.bg}`}>
                      {st.label}
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{popup.title}</h3>

                    {popup.content && (
                      <p className="text-xs text-gray-500 line-clamp-2">{popup.content}</p>
                    )}

                    {(popup.startAt || popup.endAt) && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <CalendarRange className="w-3 h-3 shrink-0" />
                        {fmtDate(popup.startAt)} ~ {fmtDate(popup.endAt)}
                      </div>
                    )}

                    {popup.linkUrl && (
                      <div className="flex items-center gap-1 text-xs text-blue-500 truncate">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{popup.linkUrl}</span>
                      </div>
                    )}
                  </div>

                  {/* 액션 */}
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(popup)}
                      className="flex items-center gap-1.5 flex-1 justify-center py-2 border border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      {popup.isActive
                        ? <><ToggleRight className="w-4 h-4 text-blue-600" /> 활성</>
                        : <><ToggleLeft className="w-4 h-4 text-gray-400" /> 비활성</>}
                    </button>
                    <button
                      onClick={() => setEditTarget(popup)}
                      className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(popup)}
                      className="p-2 border border-red-200 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 등록/수정 모달 */}
      {editTarget !== undefined && (
        <PopupFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(undefined)}
        />
      )}

      {/* 삭제 확인 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-2">팝업 삭제</h3>
            <p className="text-sm text-gray-500 mb-5">
              "{deleteTarget.title}" 팝업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
