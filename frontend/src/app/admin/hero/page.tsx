'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImageIcon, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';

interface HeroSettings {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  imageUrl: string;
  imagePosition: string;
  mobileImageUrl: string;
}

const FOCAL_POINTS = [
  { label: '좌상단', value: 'left top' },
  { label: '상단',   value: 'center top' },
  { label: '우상단', value: 'right top' },
  { label: '좌측',   value: 'left center' },
  { label: '중앙',   value: 'center center' },
  { label: '우측',   value: 'right center' },
  { label: '좌하단', value: 'left bottom' },
  { label: '하단',   value: 'center bottom' },
  { label: '우하단', value: 'right bottom' },
];

export default function AdminHeroPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<HeroSettings>({
    badge: '', title: '', titleHighlight: '', subtitle: '',
    imageUrl: '', imagePosition: 'center center', mobileImageUrl: '',
  });
  const [fetching, setFetching] = useState(true);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) { router.push('/'); return; }
    if (user) {
      api.get<HeroSettings>('/site-settings/hero')
        .then(r => setForm({ imagePosition: 'center center', mobileImageUrl: '', ...r }))
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user, loading]);

  const handleImageFile = async (file: File | null, type: 'desktop' | 'mobile') => {
    if (!file) return;
    if (type === 'desktop') setUploadingDesktop(true);
    else setUploadingMobile(true);
    try {
      const url = await uploadImage(file, 'hero');
      if (type === 'desktop') setForm(f => ({ ...f, imageUrl: url }));
      else setForm(f => ({ ...f, mobileImageUrl: url }));
      toast.success('이미지 업로드 완료');
    } catch (err: any) {
      toast.error(err.message || '업로드 실패');
    } finally {
      if (type === 'desktop') {
        setUploadingDesktop(false);
        if (desktopInputRef.current) desktopInputRef.current.value = '';
      } else {
        setUploadingMobile(false);
        if (mobileInputRef.current) mobileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/site-settings/hero', form);
      toast.success('저장되었습니다.');
    } catch (err: any) {
      toast.error(err.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof HeroSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  if (loading || !user || fetching) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">관리자 홈</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">상단이미지 관리</h1>
        <p className="text-sm text-gray-400 mt-1">홈 화면 상단 섹션의 배경 이미지와 텍스트를 설정합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">

        {/* 데스크탑 배경 이미지 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-4 h-4 text-gray-500" />
            <Label className="block">데스크탑 배경 이미지 <span className="text-xs text-gray-400 font-normal">비워두면 기본 그라디언트 사용</span></Label>
          </div>
          {form.imageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-3">
              <img src={form.imageUrl} alt="히어로 배경" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 mb-3 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
              <p className="text-xs text-white/70">이미지 없음 — 기본 그라디언트 사용 중</p>
            </div>
          )}
          <div className="flex gap-2 mb-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => desktopInputRef.current?.click()} disabled={uploadingDesktop} className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              {uploadingDesktop ? '업로드 중...' : '이미지 선택'}
            </Button>
            {form.imageUrl && (
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))} className="text-red-500 border-red-200 hover:bg-red-50">
                이미지 제거
              </Button>
            )}
          </div>
          <input ref={desktopInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={e => handleImageFile(e.target.files?.[0] ?? null, 'desktop')} />
          <p className="text-xs text-gray-400">권장 사이즈: <span className="text-blue-500 font-medium">1920 × 400px</span> / JPG·PNG·WebP</p>
        </div>

        {/* 이미지 초점 위치 */}
        {form.imageUrl && (
          <div>
            <Label className="mb-2 block">이미지 초점 위치 <span className="text-xs text-gray-400 font-normal">이미지가 잘릴 때 어느 부분을 중심으로 보여줄지 선택</span></Label>
            <div className="grid grid-cols-3 gap-1.5 w-40">
              {FOCAL_POINTS.map(fp => (
                <button
                  key={fp.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, imagePosition: fp.value }))}
                  title={fp.label}
                  className={[
                    'h-9 rounded-lg border text-xs font-medium transition-all',
                    form.imagePosition === fp.value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600',
                  ].join(' ')}
                >
                  {fp.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">현재: <span className="text-gray-600 font-medium">{FOCAL_POINTS.find(f => f.value === form.imagePosition)?.label ?? '중앙'}</span></p>
          </div>
        )}

        {/* 모바일 이미지 */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-gray-500" />
            <Label className="block">모바일 전용 이미지 <span className="text-xs text-gray-400 font-normal">선택사항 — 없으면 데스크탑 이미지를 전체 표시</span></Label>
          </div>
          <p className="text-xs text-gray-400 mb-2">모바일(640px 미만)에서는 가로로 긴 이미지가 많이 잘리므로, 정방형·세로 이미지를 별도 등록하면 좋습니다.</p>
          {form.mobileImageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-3 w-40">
              <img src={form.mobileImageUrl} alt="모바일 배경" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, mobileImageUrl: '' }))}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null}
          <div className="flex gap-2 mb-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => mobileInputRef.current?.click()} disabled={uploadingMobile} className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              {uploadingMobile ? '업로드 중...' : form.mobileImageUrl ? '이미지 변경' : '모바일 이미지 선택'}
            </Button>
            {form.mobileImageUrl && (
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, mobileImageUrl: '' }))} className="text-red-500 border-red-200 hover:bg-red-50">
                제거
              </Button>
            )}
          </div>
          <input ref={mobileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={e => handleImageFile(e.target.files?.[0] ?? null, 'mobile')} />
          <p className="text-xs text-gray-400">권장 사이즈: <span className="text-blue-500 font-medium">640 × 400px</span> (정방형 또는 세로형 가능)</p>
        </div>

        <hr className="border-gray-100" />

        {/* 뱃지 텍스트 */}
        <div>
          <Label>뱃지 텍스트 <span className="text-xs text-gray-400 font-normal">상단 작은 태그 (비워두면 숨김)</span></Label>
          <Input value={form.badge} onChange={set('badge')} className="mt-1" placeholder="예) ⚡ 국내 최대 배터리 전문 쇼핑몰" />
        </div>

        <div>
          <Label>제목 (첫째 줄)</Label>
          <Input value={form.title} onChange={set('title')} className="mt-1" placeholder="예) 당신의 기기에 맞는" />
        </div>

        <div>
          <Label>강조 텍스트 (둘째 줄) <span className="text-xs text-gray-400 font-normal">색상 강조 표시</span></Label>
          <Input value={form.titleHighlight} onChange={set('titleHighlight')} className="mt-1" placeholder="예) 완벽한 배터리" />
        </div>

        <div>
          <Label>부제목 <span className="text-xs text-gray-400 font-normal">비워두면 숨김</span></Label>
          <Textarea value={form.subtitle} onChange={set('subtitle')} className="mt-1" rows={3} placeholder="예) 리튬, 알카라인, 충전용 배터리까지..." />
        </div>

        {/* 미리보기 */}
        <div>
          <Label className="mb-2 block text-gray-500">미리보기</Label>
          <div
            className="rounded-xl overflow-hidden relative text-white"
            style={form.imageUrl ? {
              backgroundImage: `url(${form.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: form.imagePosition || 'center center',
            } : undefined}
          >
            {form.imageUrl
              ? <div className="absolute inset-0 bg-black/50" />
              : <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700" />
            }
            <div className="relative px-6 py-8">
              {form.badge && (
                <span className="inline-flex text-xs px-3 py-1 rounded-full bg-white/15 border border-white/25 mb-3">
                  {form.badge}
                </span>
              )}
              <h2 className="text-2xl font-bold leading-snug mb-2">
                {form.title || '제목'}<br />
                <span className={form.imageUrl ? 'text-white/80' : 'text-blue-200'}>
                  {form.titleHighlight || '강조 텍스트'}
                </span>
              </h2>
              {form.subtitle && <p className="text-sm text-white/75">{form.subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving || uploadingDesktop || uploadingMobile} className="bg-blue-600 hover:bg-blue-700">
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
