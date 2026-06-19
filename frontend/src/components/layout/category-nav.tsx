'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';

const STATIC_FRONT = [
  { label: '전체상품', href: '/products' },
  { label: '베스트', href: '/products?sort=best' },
];

export default function CategoryNav() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategoryId = searchParams.get('categoryId');
  const currentSort = searchParams.get('sort');

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const delta = x - dragRef.current.startX;
    if (Math.abs(delta) > 4) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const onMouseUp = () => {
    dragRef.current.active = false;
    setIsDragging(false);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  const isActive = (href: string, catId?: string) => {
    if (catId) return pathname === '/products' && currentCategoryId === catId;
    if (href === '/products?sort=best') return pathname === '/products' && currentSort === 'best';
    if (href === '/products') return pathname === '/products' && !currentCategoryId && !currentSort;
    return pathname === href;
  };

  return (
    <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* 왼쪽 스크롤 버튼 */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-r from-white via-white to-transparent pr-4 flex items-center"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
        )}

        {/* 카테고리 목록 */}
        <div
          ref={scrollRef}
          className={`flex items-center gap-0.5 overflow-x-auto py-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClickCapture={onClickCapture}
        >
          {STATIC_FRONT.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              draggable={false}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {categories.length > 0 && (
            <div className="w-px h-4 bg-gray-200 mx-1.5 shrink-0" />
          )}

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?categoryId=${cat.id}`}
              draggable={false}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
                isActive('', cat.id)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {cat.name}
            </Link>
          ))}

          <div className="w-px h-4 bg-gray-200 mx-1.5 shrink-0" />

          <Link
            href="/inquiry"
            draggable={false}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
              pathname === '/inquiry'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            문의게시판
          </Link>
        </div>

        {/* 오른쪽 스크롤 버튼 */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-l from-white via-white to-transparent pl-4 flex items-center"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}
