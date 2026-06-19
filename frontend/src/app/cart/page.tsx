'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CartPage() {
  const { cart, updateItem, removeItem, itemCount } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  if (loading) return <div className="flex items-center justify-center min-h-96"><div className="text-gray-400">불러오는 중...</div></div>;
  if (!user) return null;

  const totalAmount = cart?.items.reduce(
    (sum, item) => sum + (item.product.price + (item.optionPrice ?? 0)) * item.quantity,
    0
  ) ?? 0;
  const SHIPPING_THRESHOLD = 30000;
  const shippingFee = totalAmount >= SHIPPING_THRESHOLD ? 0 : 3000;

  const handleUpdate = async (itemId: string, quantity: number) => {
    try { await updateItem(itemId, quantity); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleRemove = async (itemId: string) => {
    try { await removeItem(itemId); toast.success('삭제되었습니다.'); }
    catch (err: any) { toast.error(err.message); }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-gray-200 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">장바구니가 비어있습니다.</h2>
        <p className="text-gray-400 mb-6 text-sm">마음에 드는 배터리를 담아보세요.</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/products">쇼핑 계속하기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">장바구니 ({itemCount})</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 아이템 목록 */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => {
            const unitPrice = item.product.price + (item.optionPrice ?? 0);
            const options = item.selectedOptions ?? [];
            return (
              <div key={item.id} className="bg-white rounded-xl border p-4 flex gap-4">
                <Link href={`/products/${item.product.slug}`} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-50 border">
                  {item.product.imageUrls?.[0] ? (
                    <Image src={item.product.imageUrls[0]} alt={item.product.name} fill className="object-contain p-2" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center"><Zap className="w-8 h-8 text-gray-200" /></div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="font-medium text-sm text-gray-900 hover:text-blue-600 line-clamp-2">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{item.product.category?.name}</p>

                  {/* 선택 옵션 표시 */}
                  {options.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {options.map((opt, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {opt.groupName}: {opt.optionName}
                          {opt.price !== 0 && (
                            <span className="ml-1 opacity-75">
                              ({opt.price > 0 ? '+' : ''}{opt.price.toLocaleString()}원)
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="font-bold text-gray-900 mt-1.5">{unitPrice.toLocaleString()}원</p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => handleUpdate(item.id, item.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => handleUpdate(item.id, item.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{(unitPrice * item.quantity).toLocaleString()}원</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 주문 요약 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-5 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">주문 요약</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>상품 금액</span>
                <span>{totalAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>배송비</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}
                </span>
              </div>
              {totalAmount < SHIPPING_THRESHOLD && (
                <p className="text-xs text-blue-500">
                  {(SHIPPING_THRESHOLD - totalAmount).toLocaleString()}원 더 담으면 무료 배송!
                </p>
              )}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg mb-5">
              <span>합계</span>
              <span className="text-blue-600">{(totalAmount + shippingFee).toLocaleString()}원</span>
            </div>
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base" asChild>
              <Link href="/checkout">
                결제하기
              </Link>
            </Button>
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link href="/products">쇼핑 계속하기</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
