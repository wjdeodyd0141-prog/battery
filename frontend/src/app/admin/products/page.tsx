'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Eye, EyeOff, Package, Settings2, ChevronLeft, ChevronRight, Search, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Product, Category } from '@/lib/types';
import { toast } from 'sonner';
import ProductFormModal from '@/components/admin/product-form-modal';

const PER_PAGE_OPTIONS = [10, 20, 30];

export default function AdminProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const load = async () => {
    const [prods, cats] = await Promise.all([
      api.get<Product[]>('/products/admin-list').catch(() => [] as Product[]),
      api.get<Category[]>('/categories').catch(() => [] as Category[]),
    ]);
    setProducts(prods);
    setCategories(cats);
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) { router.push('/'); return; }
    if (user) load();
  }, [user, loading]);

  // 카테고리·검색·perPage 변경 시 첫 페이지로
  const handleCategoryChange = (id: string) => { setSelectedCategoryId(id); setPage(1); };
  const handlePerPageChange = (n: number) => { setPerPage(n); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const toggleActive = async (product: Product) => {
    try {
      await api.patch(`/products/${product.id}`, { isActive: !product.isActive });
      toast.success(product.isActive ? '상품을 비활성화했습니다.' : '상품을 활성화했습니다.');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await api.patch(`/products/${product.id}/featured`, {});
      toast.success(product.isFeatured ? '추천 상품에서 해제했습니다.' : '추천 상품으로 등록했습니다.');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter(p => {
      const matchCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchSearch = !keyword || p.name.toLowerCase().includes(keyword);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) map[p.categoryId] = (map[p.categoryId] ?? 0) + 1;
    return map;
  }, [products]);

  // 페이지 번호 목록 (최대 5개 표시)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) {
      range.push(i);
    }
    return range;
  }, [safePage, totalPages]);

  if (loading || !user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">관리자 홈</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">상품 관리</h1>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditProduct(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1" /> 상품 등록
        </Button>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        <button
          onClick={() => handleCategoryChange('all')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
            selectedCategoryId === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          전체 <span className={`ml-1 text-xs ${selectedCategoryId === 'all' ? 'opacity-80' : 'text-gray-400'}`}>({products.length})</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              selectedCategoryId === cat.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {cat.name}
            <span className={`ml-1 text-xs ${selectedCategoryId === cat.id ? 'opacity-80' : 'text-gray-400'}`}>
              ({countByCategory[cat.id] ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* 검색창 */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
        <Input
          placeholder="상품명 검색"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="pl-9 pr-9 h-9 text-sm"
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

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{selectedCategoryId === 'all' ? '등록된 상품이 없습니다.' : '이 카테고리에 상품이 없습니다.'}</p>
        </div>
      ) : (
        <>
          {/* 테이블 헤더: 건수 + 노출 수 선택 */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">
              총 <span className="font-semibold text-gray-800">{filtered.length}</span>개
              {totalPages > 1 && <span className="ml-1 text-gray-400">({safePage}/{totalPages} 페이지)</span>}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 mr-1">노출</span>
              {PER_PAGE_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => handlePerPageChange(n)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    perPage === n
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {n}개
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">상품명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">카테고리</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">가격</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">적립률</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">재고</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">추천</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium line-clamp-1">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name}</td>
                    <td className="px-4 py-3 text-right">{p.price.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right">
                      {p.mileageRate != null
                        ? <span className="text-emerald-600 font-medium">{p.mileageRate}%</span>
                        : <span className="text-gray-300 text-xs">기본</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.stock === 0 ? 'text-red-500' : 'text-gray-700'}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.isActive ? 'default' : 'secondary'} className={p.isActive ? 'bg-green-50 text-green-700' : ''}>
                        {p.isActive ? '판매중' : '숨김'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFeatured(p)}
                        title={p.isFeatured ? '추천 해제' : '추천 등록'}
                        className={`p-1.5 rounded-lg transition-colors ${p.isFeatured ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                      >
                        <Star className={`w-4 h-4 ${p.isFeatured ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditProduct(p); setShowModal(true); }} title="상품 수정">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Link href={`/admin/products/${p.id}/options`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-purple-500 hover:text-purple-700 hover:bg-purple-50" title="옵션 관리">
                            <Settings2 className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(p)} title={p.isActive ? '숨기기' : '활성화'}>
                          {p.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers[0] > 1 && (
                <>
                  <button onClick={() => setPage(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all">1</button>
                  {pageNumbers[0] > 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
                </>
              )}

              {pageNumbers.map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                    n === safePage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {n}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-1 text-gray-400 text-sm">…</span>}
                  <button onClick={() => setPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all">{totalPages}</button>
                </>
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <ProductFormModal
          product={editProduct}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
