export const revalidate = 60;
import { notFound } from 'next/navigation';
import Image from 'next/image';
import sanitizeHtml from 'sanitize-html';
import { Zap, Star, Package, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { Product, ProductSpecs } from '@/lib/types';
import AddToCartButton from '@/components/products/add-to-cart-button';
import ReviewList from '@/components/products/review-list';
import DetailImagesSection from '@/components/products/detail-images-section';
import ImageGallery from '@/components/products/image-gallery';

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

  const SPEC_LABELS: Record<string, string> = {
    manufacturer: '제조사', brand: '브랜드', modelName: '모델명', origin: '원산지',
    mfgDate: '제조일자', batteryType: '배터리종류', capacity: '배터리용량',
    lifespan: '평균수명', kcCertNo: 'KC인증번호', voltage: '정격전압',
    current: '정격전류', weight: '무게', dimensions: '크기',
  };
  const specEntries = product.specs
    ? Object.entries(product.specs as ProductSpecs).filter(([, v]) => v)
    : [];

  const allImages = product.imageUrls ?? [];
  const detailImages = product.detailImageUrls ?? [];
  // VULN-02: XSS 방어 - 허용된 태그/속성만 남기고 이벤트 핸들러 제거
  const detailContent = product.detailContent
    ? sanitizeHtml(product.detailContent, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3', 'hr', 'iframe', 'div']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt', 'width', 'height', 'style'],
          iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'style'],
          div: ['class', 'data-youtube-video', 'style'],
          '*': ['class'],
        },
        allowedSchemes: ['https', 'http'],
        allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com'],
      })
    : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">

        {/* ── 상단: 메인 이미지 + 정보 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 mb-6">

          {/* 이미지 영역 */}
          <ImageGallery images={allImages} productName={product.name} outOfStock={product.stock === 0} />

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

            {product.mileageRate != null && (
              <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5">
                <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-emerald-700">
                  구매 시 <strong className="text-emerald-600">{Math.floor(product.price * product.mileageRate / 100).toLocaleString()}원</strong> 마일리지 적립
                  <span className="text-emerald-400 ml-1">({product.mileageRate}%)</span>
                </span>
              </div>
            )}

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

          {/* 상세 내용 */}
          <div className="p-6 sm:p-10">
            {/* 제품 스펙 테이블 */}
            {specEntries.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">제품 사양</h3>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {specEntries.map(([key, value]) => (
                      <tr key={key} className="border-b border-gray-100 last:border-0">
                        <td className="py-2.5 pr-4 text-gray-500 font-medium whitespace-nowrap w-32">
                          {SPEC_LABELS[key] ?? key}
                        </td>
                        <td className="py-2.5 text-gray-800">{value as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {detailContent ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: detailContent }}
              />
            ) : specEntries.length === 0 ? (
              <DetailImagesSection detailImageUrls={detailImages} productName={product.name} />
            ) : null}
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
