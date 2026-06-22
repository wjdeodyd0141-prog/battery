export const revalidate = 60;

import Link from 'next/link';
import { Zap, ShieldCheck, Truck, HeadphonesIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Product, Category } from '@/lib/types';
import ProductCard from '@/components/products/product-card';
import HomeInquirySection from '@/components/home/inquiry-section';
import HomeFaqSection from '@/components/home/faq-section';
import BannerSlider from '@/components/home/banner-slider';
import PopupManager from '@/components/home/popup-manager';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const products = await api.get<Product[]>('/products');
    return products.slice(0, 8);
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    return await api.get<Category[]>('/categories');
  } catch {
    return [];
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  default: '⚡',
  lithium: '🔋',
  alkaline: '🪫',
  rechargeable: '♻️',
};

const FEATURES = [
  { icon: Truck, title: '무료 배송', desc: '3만원 이상 구매 시', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: ShieldCheck, title: '품질 보증', desc: '정품 인증 배터리', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Zap, title: '빠른 배송', desc: '당일 발송 (오후 2시 전)', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: HeadphonesIcon, title: '고객센터', desc: '평일 09:00 ~ 18:00', color: 'text-violet-600', bg: 'bg-violet-50' },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div className="overflow-x-hidden">
      <PopupManager />
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-500/20 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <Badge className="mb-6 inline-flex bg-white/15 text-white border-white/25 hover:bg-white/15 text-sm px-4 py-1.5 rounded-full backdrop-blur-sm">
              ⚡ 국내 최대 배터리 전문 쇼핑몰
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              당신의 기기에 맞는<br />
              <span className="text-blue-200">완벽한 배터리</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/90 max-w-xl leading-relaxed">
              리튬, 알카라인, 충전용 배터리까지 — 국내외 최고 브랜드 제품을 합리적인 가격으로 만나보세요.
            </p>
          </div>
        </div>
      </section>

      {/* 특징 배지 */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {FEATURES.map((item) => (
              <div key={item.title} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 롤링 배너 */}
      <BannerSlider />

      {/* 카테고리 */}
      {categories.length > 0 && (
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">CATEGORY</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">카테고리</h2>
              </div>
              <Link href="/products" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                전체보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {categories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={`/products?categoryId=${cat.id}`}
                  className="group bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col items-center gap-3 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-200">
                    {CATEGORY_ICONS[cat.name?.toLowerCase()] ?? CATEGORY_ICONS.default}
                  </div>
                  <div className="text-center">
                    <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                    {cat._count && (
                      <p className="text-xs text-gray-400 mt-0.5">{cat._count.products}개 상품</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 추천 상품 */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">FEATURED</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">추천 상품</h2>
            </div>
            <Link href="/products" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors font-medium">
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-medium">아직 등록된 상품이 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* 문의게시판 */}
      <HomeInquirySection />

      {/* 자주 묻는 질문 */}
      <HomeFaqSection />
    </div>
  );
}
