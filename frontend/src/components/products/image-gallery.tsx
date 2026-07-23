'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface Props {
  images: string[];
  productName: string;
  outOfStock: boolean;
}

export default function ImageGallery({ images, productName, outOfStock }: Props) {
  const [selected, setSelected] = useState(0);
  const mainImage = images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden aspect-square relative">
        {mainImage ? (
          <Image src={images[selected] ?? mainImage} alt={productName} fill className="object-contain p-8" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3">
            <Zap className="w-20 h-20 text-gray-200" />
            <span className="text-xs text-gray-300">이미지 없음</span>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
            <Badge variant="secondary" className="text-base px-4 py-1.5">품절</Badge>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.slice(0, 5).map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 border-2 rounded-xl overflow-hidden bg-white shrink-0 transition-colors ${
                selected === i ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image src={url} alt="" fill className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
