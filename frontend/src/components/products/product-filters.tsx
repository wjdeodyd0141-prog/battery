'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  categories: Category[];
  activeCategory?: string;
}

export default function ProductFilters({ categories, activeCategory }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">카테고리</h3>
      <ul className="space-y-1">
        <li>
          <Link
            href="/products"
            className={cn(
              'block px-3 py-2 rounded-lg text-sm transition-colors',
              !activeCategory ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            전체
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/products?categoryId=${cat.id}`}
              className={cn(
                'block px-3 py-2 rounded-lg text-sm transition-colors',
                activeCategory === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {cat.name}
              {cat._count && <span className="ml-1 text-gray-400">({cat._count.products})</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
