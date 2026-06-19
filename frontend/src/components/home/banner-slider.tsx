'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Banner } from '@/lib/types';

const DRAG_THRESHOLD = 50;

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef({ startX: 0, moved: false });

  useEffect(() => {
    api.get<Banner[]>('/banners').then(setBanners).catch(() => {});
  }, []);

  const go = useCallback((idx: number, fromBanners?: Banner[]) => {
    const len = (fromBanners ?? banners).length;
    if (len === 0) return;
    setCurrent((idx + len) % len);
  }, [banners]);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    timerRef.current = setTimeout(() => go(current + 1), 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, banners.length, isPaused, go]);

  // ── 마우스 드래그 ──────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, moved: false };
    setDragging(true);
    setIsPaused(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - dragRef.current.startX) > 4) dragRef.current.moved = true;
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!dragging) return;
    setDragging(false);
    const diff = e.clientX - dragRef.current.startX;
    if (Math.abs(diff) >= DRAG_THRESHOLD) {
      go(diff < 0 ? current + 1 : current - 1);
    }
    setTimeout(() => setIsPaused(false), 300);
  };
  const onMouseLeave = () => {
    if (dragging) { setDragging(false); setTimeout(() => setIsPaused(false), 300); }
    else setIsPaused(false);
  };

  // ── 터치 스와이프 (모바일) ────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    dragRef.current = { startX: e.touches[0].clientX, moved: false };
    setIsPaused(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (Math.abs(e.touches[0].clientX - dragRef.current.startX) > 4) dragRef.current.moved = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - dragRef.current.startX;
    if (Math.abs(diff) >= DRAG_THRESHOLD) {
      go(diff < 0 ? current + 1 : current - 1);
    }
    setTimeout(() => setIsPaused(false), 300);
  };

  // 드래그 중 링크 클릭 방지
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.moved) { e.preventDefault(); e.stopPropagation(); dragRef.current.moved = false; }
  };

  if (banners.length === 0) return null;

  const banner = banners[current];

  const Wrapper = banner.linkUrl
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={banner.linkUrl!} className="block w-full h-full" draggable={false}>{children}</Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="w-full h-full">{children}</div>
      );

  return (
    <section
      className={`relative w-full overflow-hidden bg-gray-900 select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ aspectRatio: '16/5' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >
      {/* 슬라이드 이미지 */}
      {banners.map((b, idx) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <Wrapper>
            <Image
              src={b.imageUrl}
              alt={b.title || `배너 ${idx + 1}`}
              fill
              className="object-cover pointer-events-none"
              priority={idx === 0}
              sizes="100vw"
              draggable={false}
            />
            {(b.title || b.subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end pointer-events-none">
                <div className="px-8 pb-8 sm:px-12 sm:pb-10">
                  {b.title && (
                    <p className="text-white text-xl sm:text-3xl font-bold drop-shadow-md">{b.title}</p>
                  )}
                  {b.subtitle && (
                    <p className="text-white/80 text-sm sm:text-base mt-1 drop-shadow">{b.subtitle}</p>
                  )}
                </div>
              </div>
            )}
          </Wrapper>
        </div>
      ))}

      {/* 이전 버튼 */}
      {banners.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); go(current - 1); setIsPaused(true); setTimeout(() => setIsPaused(false), 300); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
          aria-label="이전"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* 다음 버튼 */}
      {banners.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); go(current + 1); setIsPaused(true); setTimeout(() => setIsPaused(false), 300); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
          aria-label="다음"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* 인디케이터 dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                idx === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`${idx + 1}번 배너`}
            />
          ))}
        </div>
      )}

      {/* 슬라이드 카운터 */}
      {banners.length > 1 && (
        <div className="absolute top-3 right-3 z-20 px-2.5 py-1 bg-black/30 text-white text-xs rounded-full pointer-events-none">
          {current + 1} / {banners.length}
        </div>
      )}
    </section>
  );
}
