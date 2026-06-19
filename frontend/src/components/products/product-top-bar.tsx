'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

const PER_PAGE_OPTIONS = [10, 30, 50, 100];

interface Props {
  total: number;
  perPage: number;
  activeSearch?: string;
}

export default function ProductTopBar({ total, perPage, activeSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(activeSearch ?? '');

  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    navigate({ search: value || null });
  };

  const setPerPage = (n: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('perPage', String(n));
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* 개수 선택 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 mr-1">페이지당</span>
        {PER_PAGE_OPTIONS.map((n) => (
          <button
            key={n}
            onClick={() => setPerPage(n)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              perPage === n
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {n}개
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-1">· 총 {total}개</span>
      </div>

      {/* 검색 */}
      <div className="relative w-full sm:w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
        <input
          type="text"
          placeholder="상품명 검색"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors placeholder:text-gray-400 text-gray-800"
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
  );
}
