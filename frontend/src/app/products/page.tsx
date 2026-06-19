export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { api } from '@/lib/api';
import { Product, Category } from '@/lib/types';
import ProductCard from '@/components/products/product-card';
import ProductPagination from '@/components/products/product-pagination';
import ProductTopBar from '@/components/products/product-top-bar';
import { Zap } from 'lucide-react';

interface PageProps {
  searchParams: { categoryId?: string; search?: string; sort?: string; page?: string; perPage?: string };
}

interface ProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

async function getProducts(
  categoryId?: string,
  search?: string,
  sort?: string,
  page?: number,
  limit?: number,
): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (categoryId) params.set('category', categoryId);
  if (search) params.set('search', search);
  if (sort) params.set('sort', sort);
  params.set('page', String(page ?? 1));
  params.set('limit', String(limit ?? 30));
  return api.get<ProductsResponse>(`/products?${params.toString()}`);
}

async function getCategories(): Promise<Category[]> {
  return api.get<Category[]>('/categories');
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const isBest = searchParams.sort === 'best';
  const perPage = [10, 30, 50, 100].includes(Number(searchParams.perPage))
    ? Number(searchParams.perPage)
    : 30;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [data, categories] = await Promise.all([
    getProducts(searchParams.categoryId, searchParams.search, searchParams.sort, page, perPage).catch(() => ({
      products: [], total: 0, totalPages: 1, page: 1, limit: perPage,
    })),
    getCategories().catch(() => []),
  ]);

  const activeCategory = categories.find((c) => c.id === searchParams.categoryId);
  const pageTitle = isBest ? '베스트 상품' : activeCategory ? activeCategory.name : '전체 상품';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div>
          {/* 메인 콘텐츠 */}
          <div className="min-w-0">
            {/* 상단 바: 개수 선택 + 검색 */}
            <Suspense>
              <ProductTopBar
                total={data.total}
                perPage={perPage}
                activeSearch={searchParams.search}
              />
            </Suspense>

            {/* 상품 그리드 */}
            {data.products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
                  {data.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Suspense>
                  <ProductPagination
                    total={data.total}
                    current={page}
                    totalPages={data.totalPages}
                    perPage={perPage}
                  />
                </Suspense>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-2xl border border-gray-100 mt-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-500">
                  {searchParams.search
                    ? `'${searchParams.search}' 검색 결과가 없습니다`
                    : '상품이 없습니다'}
                </p>
                <p className="text-sm mt-1">
                  {searchParams.search ? '다른 검색어를 입력해보세요.' : '다른 카테고리를 선택해보세요.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

