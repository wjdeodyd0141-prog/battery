'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';

interface Props {
  detailImageUrls: string[];
  productName: string;
}

const PREVIEW_COUNT = 3;

export default function DetailImagesSection({ detailImageUrls, productName }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (detailImageUrls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-28 gap-4 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-gray-200" />
        </div>
        <div>
          <p className="font-semibold text-gray-400">상세 이미지가 없습니다</p>
          <p className="text-sm text-gray-300 mt-1">관리자 페이지에서 이미지 URL을 추가해주세요.</p>
        </div>
      </div>
    );
  }

  const shouldShowToggle = detailImageUrls.length > PREVIEW_COUNT;
  const visibleImages = expanded ? detailImageUrls : detailImageUrls.slice(0, PREVIEW_COUNT);

  return (
    <div className="relative">
      <div className="flex flex-col gap-4">
        {visibleImages.map((url, i) => (
          <div key={i} className="relative w-full rounded-xl overflow-hidden bg-gray-50">
            <Image
              src={url}
              alt={`${productName} 상세 이미지 ${i + 1}`}
              width={900}
              height={600}
              className="w-full h-auto object-contain"
            />
          </div>
        ))}
      </div>

      {shouldShowToggle && !expanded && (
        <div className="relative mt-0">
          <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          <button
            onClick={() => setExpanded(true)}
            className="w-full flex items-center justify-center gap-2 py-4 mt-2 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <ChevronDown className="w-4 h-4" />
            상품 상세 더보기 ({detailImageUrls.length - PREVIEW_COUNT}개 더)
          </button>
        </div>
      )}

      {shouldShowToggle && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full flex items-center justify-center gap-2 py-4 mt-4 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-500 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <ChevronUp className="w-4 h-4" />
          접기
        </button>
      )}
    </div>
  );
}
