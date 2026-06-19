'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Category } from '@/lib/types';

interface Props {
  categories: Category[];
  activeCategory?: string;
  activeSearch?: string;
}

export default function ProductTopFilters({ categories, activeCategory, activeSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(activeSearch ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId?: string) => {
    navigate({ categoryId: categoryId ?? null });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    navigate({ search: value || null });
  };

  const allCategories = [
    { id: undefined, name: '전체 상품', slug: '' },
    ...categories,
  ];

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 카테고리 탭 */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 scrollbar-hide">
          {allCategories.map((cat) => {
            const isActive = cat.id === undefined ? !activeCategory : activeCategory === cat.id;
            return (
              <button
                key={cat.id ?? 'all'}
                onClick={() => handleCategoryClick(cat.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {cat.name}
                {cat._count !== undefined && (
                  <span className={`ml-1 text-xs ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                    ({cat._count.products})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 검색바 */}
        <div className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="상품명 검색"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors placeholder:text-gray-400 text-gray-800"
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
