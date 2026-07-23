'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    try {
      await addItem(product.id, 1);
      toast.success('장바구니에 추가되었습니다.');
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.');
    }
  };

  const mainImage = product.imageUrls?.[0];
  const isSoldOut = product.stock === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-12 h-12 text-gray-200" />
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">품절</Badge>
          </div>
        )}
        {!isSoldOut && product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5">재고 {product.stock}개</Badge>
          </div>
        )}
      </div>

      {/* 내용 영역 */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1.5">
        {product.category?.name && (
          <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-wide">{product.category.name}</p>
        )}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
          {product.name}
        </h3>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900 text-base">{product.price.toLocaleString()}</span>
            <span className="text-xs text-gray-500 ml-0.5">원</span>
            {product.mileageRate != null && (
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{product.mileageRate}% 적립</p>
            )}
          </div>
          <Button
            size="sm"
            className="h-8 w-8 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-40 transition-colors"
            onClick={handleAddToCart}
            disabled={isSoldOut}
            aria-label="장바구니 담기"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
