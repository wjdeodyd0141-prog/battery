'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Trash2, ChevronLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface MyReview {
  id: string;
  rating: number;
  content: string;
  imageUrls: string[];
  createdAt: string;
  product: { name: string; slug: string; imageUrls: string[] };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-4 h-4 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function MyReviewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    api.get<MyReview[]>('/reviews/my')
      .then(setReviews)
      .catch(() => toast.error('리뷰를 불러오지 못했습니다.'))
      .finally(() => setFetching(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success('리뷰가 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/my" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">내 리뷰</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {fetching ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">작성한 리뷰가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">구매한 상품에 리뷰를 남겨보세요.</p>
            <Button className="mt-6 bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/products">상품 보러가기</Link>
            </Button>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex gap-3 mb-3">
                <Link href={`/products/${review.product.slug}`} className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-gray-50 border">
                  {review.product.imageUrls[0] ? (
                    <Image src={review.product.imageUrls[0]} alt={review.product.name} fill className="object-contain p-1" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-200 text-xs">No img</div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${review.product.slug}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1">
                    {review.product.name}
                  </Link>
                  <StarRating rating={review.rating} />
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0 self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
              {review.imageUrls.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {review.imageUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <Image src={url} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
