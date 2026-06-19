export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Zap, Star, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import AddToCartButton from '@/components/products/add-to-cart-button';
import ReviewList from '@/components/products/review-list';
import DetailImagesSection from '@/components/products/detail-images-section';

interface PageProps {
  params: { slug: string };
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await api.get<Product>(`/products/${slug}`);
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) return notFound();

  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  const mainImage = product.imageUrls?.[0];
  const thumbImages = product.imageUrls?.slice(1, 5) ?? [];
  const detailImages = product.detailImageUrls ?? [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">

        {/* ── 상단: 메인 이미지 + 정보 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 mb-6">

          {/* 이미지 영역 */}
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden aspect-square relative">
              {mainImage ? (
                <Image src={mainImage} alt={product.name} fill className="object-contain p-8" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3">
                  <Zap className="w-20 h-20 text-gray-200" />
                  <span className="text-xs text-gray-300">이미지 없음</span>
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                  <Badge variant="secondary" className="text-base px-4 py-1.5">품절</Badge>
                </div>
              )}
            </div>

            {/* 썸네일 */}
            {thumbImages.length > 0 && (
              <div className="flex gap-2">
                {thumbImages.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 sm:w-20 sm:h-20 border border-gray-200 rounded-xl overflow-hidden bg-white shrink-0">
                    <Image src={url} alt="" fill className="object-contain p-1.5" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
            <div>
              <Badge className="mb-2 bg-blue-50 text-blue-600 border-0 hover:bg-blue-50">
                {product.category?.name}
              </Badge>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
            </div>

            {avgRating && (
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="font-semibold text-sm">{avgRating}</span>
                <span className="text-sm text-gray-400">({product.reviews?.length}개 리뷰)</span>
              </div>
            )}

            <div>
              <span className="text-3xl font-bold text-gray-900">{product.price.toLocaleString()}</span>
              <span className="text-lg text-gray-500 ml-1">원</span>
            </div>

            <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-xl px-4 py-2.5">
              <Package className="w-4 h-4 text-gray-400" />
              {product.stock > 0 ? (
                <span className="text-emerald-600 font-semibold">재고 {product.stock}개 남음</span>
              ) : (
                <span className="text-red-500 font-semibold">품절</span>
              )}
            </div>

            {product.description && (
              <>
                <Separator />
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </>
            )}

            <Separator />

            {/* 배송 안내 */}
            <div className="text-xs text-gray-400 space-y-1">
              <p>✓ <span className="text-gray-600">3만원 이상 무료배송</span></p>
              <p>✓ <span className="text-gray-600">오후 2시 이전 주문 시 당일 발송</span></p>
            </div>

            <AddToCartButton product={product} />
          </div>
        </div>

        {/* ── 상품 상세 이미지 섹션 ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* 탭 헤더 */}
          <div className="border-b border-gray-100 px-6">
            <div className="flex">
              <button className="py-4 px-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 -mb-px">
                상품 상세
              </button>
            </div>
          </div>

          {/* 상세 이미지 */}
          <div className="p-6 sm:p-10">
            <DetailImagesSection detailImageUrls={detailImages} productName={product.name} />
          </div>
        </div>

        {/* ── 리뷰 ── */}
        <div className="mt-6">
          <ReviewList productId={product.id} reviews={product.reviews || []} />
        </div>

      </div>
    </div>
  );
}
