'use client';

import { useState, useMemo } from 'react';
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Product, SelectedOption } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  product: Product;
}

export default function AddToCartButton({ product }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const { addItem } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();

  const optionGroups = product.optionGroups ?? [];

  const optionPrice = useMemo(() => {
    return optionGroups.reduce((sum, group) => {
      const opt = group.options.find(o => o.id === selections[group.id]);
      return sum + (opt?.price ?? 0);
    }, 0);
  }, [selections, optionGroups]);

  const selectedOptionsList: SelectedOption[] = useMemo(() => {
    return optionGroups.flatMap(group => {
      const opt = group.options.find(o => o.id === selections[group.id]);
      if (!opt) return [];
      return [{ groupId: group.id, groupName: group.name, optionId: opt.id, optionName: opt.name, price: opt.price }];
    });
  }, [selections, optionGroups]);

  const missingRequired = optionGroups.some(g => g.required && !selections[g.id]);
  const totalItemPrice = product.price + optionPrice;

  const handleAdd = async (redirect?: boolean) => {
    if (!user) { router.push('/login'); return; }
    if (missingRequired) { toast.error('필수 옵션을 선택해주세요.'); return; }
    setLoading(true);
    try {
      await addItem(product.id, quantity, selectedOptionsList);
      toast.success(`${product.name}을(를) 장바구니에 추가했습니다.`);
      if (redirect) router.push('/cart');
    } catch (err: any) {
      if (err.message === 'Unauthorized' || err.message?.includes('인증')) {
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
        await logout();
        router.push('/login');
      } else {
        toast.error(err.message || '오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (product.stock === 0) {
    return (
      <Button disabled className="w-full h-12 text-base" size="lg">
        품절
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* 옵션 그룹 */}
      {optionGroups.length > 0 && (
        <div className="space-y-3">
          {optionGroups.map(group => (
            <div key={group.id}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm font-medium text-gray-800">{group.name}</span>
                {group.required
                  ? <span className="text-xs text-red-500 font-medium">(필수)</span>
                  : <span className="text-xs text-gray-400">(선택)</span>
                }
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map(opt => {
                  const selected = selections[group.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelections(prev => ({ ...prev, [group.id]: opt.id }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {opt.name}
                      {opt.price !== 0 && (
                        <span className={`text-xs ${selected ? 'opacity-90' : 'text-gray-400'}`}>
                          {opt.price > 0 ? `+${opt.price.toLocaleString()}` : opt.price.toLocaleString()}원
                        </span>
                      )}
                      {selected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <Separator />
        </div>
      )}

      {/* 수량 */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">수량</span>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button
            variant="ghost" size="icon" className="h-10 w-10 rounded-none"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="w-12 text-center font-medium text-sm">{quantity}</span>
          <Button
            variant="ghost" size="icon" className="h-10 w-10 rounded-none"
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <span className="text-sm text-gray-400">최대 {product.stock}개</span>
      </div>

      {/* 금액 요약 */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
        {optionPrice !== 0 && (
          <>
            <div className="flex justify-between text-sm text-gray-500">
              <span>기본 가격</span>
              <span>{product.price.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm text-blue-600">
              <span>옵션 추가금</span>
              <span>{optionPrice > 0 ? '+' : ''}{optionPrice.toLocaleString()}원</span>
            </div>
            <Separator className="my-1" />
          </>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-900">합계</span>
          <span className="text-xl font-bold text-gray-900">{(totalItemPrice * quantity).toLocaleString()}원</span>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold"
          onClick={() => handleAdd(false)}
          disabled={loading || missingRequired}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {loading ? '추가 중...' : '장바구니 담기'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 text-base font-semibold border-blue-600 text-blue-600 hover:bg-blue-50"
          onClick={() => handleAdd(true)}
          disabled={loading || missingRequired}
        >
          바로 구매
        </Button>
      </div>
      {missingRequired && (
        <p className="text-xs text-center text-red-400">필수 옵션을 모두 선택해주세요.</p>
      )}
    </div>
  );
}
