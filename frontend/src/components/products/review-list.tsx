'use client';

import { useRef, useState } from 'react';
import { Star, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Review } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';

const MAX_REVIEW_IMAGES = 3;

interface Props {
  productId: string;
  reviews: Review[];
}

export default function ReviewList({ productId, reviews: initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_REVIEW_IMAGES - imageUrls.length;
    if (remaining <= 0) { toast.error(`사진은 최대 ${MAX_REVIEW_IMAGES}장까지 첨부할 수 있습니다.`); return; }
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const f of selected) {
        const url = await uploadImage(f, 'reviews');
        newUrls.push(url);
      }
      setImageUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      toast.error(err.message || '이미지 업로드 실패');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { toast.error('리뷰 내용을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      const review = await api.post<Review>('/reviews', { productId, rating, content, imageUrls });
      setReviews([review, ...reviews]);
      setContent('');
      setRating(5);
      setImageUrls([]);
      toast.success('리뷰가 등록되었습니다.');
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        고객 리뷰 {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
      </h2>

      {avgRating && (
        <div className="bg-white rounded-xl border p-4 flex items-center gap-4 mb-6">
          <div className="text-4xl font-bold text-gray-900">{avgRating}</div>
          <div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-5 h-5 ${parseFloat(avgRating) >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">{reviews.length}개 리뷰 기준</p>
          </div>
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 mb-6">
          <h3 className="font-semibold mb-3">리뷰 작성</h3>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)}>
                <Star className={`w-7 h-7 cursor-pointer ${rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="배터리 사용 후기를 작성해주세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="mb-3"
          />
          {/* 이미지 첨부 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            {imageUrls.length < MAX_REVIEW_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-[10px]">사진</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleImageFiles(e.target.files)}
          />
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={submitting || uploading}>
            {submitting ? '등록 중...' : '리뷰 등록'}
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{review.user.name || review.user.username}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${review.rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            <p className="text-sm text-gray-700">{review.content}</p>
            {review.imageUrls && review.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {review.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-100 hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
        )}
      </div>
    </div>
  );
}
