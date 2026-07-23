'use client';

import { PlayCircle, BookOpen, MapPin, ExternalLink, Phone, Clock } from 'lucide-react';

export default function StoreInfoSection() {
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-blue-600 mb-1">FIND US</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">채널 &amp; 매장 안내</h2>
          <p className="text-gray-500 mt-2 text-sm">유튜브와 블로그에서 배터리 정보를 확인하고, 매장에서 직접 만나보세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 유튜브 */}
          <a
            href="https://www.youtube.com/@seoul_powerbank"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-4 hover:border-red-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-red-100 group-hover:scale-110 transition-all duration-200">
              <PlayCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-base">유튜브 채널</p>
              <p className="text-sm text-gray-500 mt-1">배터리 리뷰 &amp; 비교 영상</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium group-hover:underline">
              채널 바로가기 <ExternalLink className="w-3 h-3" />
            </span>
          </a>

          {/* 블로그 */}
          <a
            href="https://blog.naver.com/seoul_powerbank"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-4 hover:border-green-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-100 group-hover:scale-110 transition-all duration-200">
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-base">네이버 블로그</p>
              <p className="text-sm text-gray-500 mt-1">사용 후기 &amp; 배터리 정보</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium group-hover:underline">
              블로그 바로가기 <ExternalLink className="w-3 h-3" />
            </span>
          </a>

          {/* 매장 위치 */}
          <a
            href="https://map.kakao.com/link/search/서울특별시 강서구 공항대로 195 힐스테이트에코동익 109호"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-4 hover:border-yellow-400 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center group-hover:bg-yellow-100 group-hover:scale-110 transition-all duration-200">
              <MapPin className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-base">매장 위치</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                서울 강서구 공항대로 195<br />힐스테이트에코동익 109호
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-yellow-600 font-medium group-hover:underline">
              카카오맵으로 보기 <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        </div>

        {/* 매장 정보 배너 */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">고객센터</p>
              <p className="text-sm font-semibold text-gray-800">02-2668-3799</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-gray-100" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">운영 시간</p>
              <p className="text-sm font-semibold text-gray-800">평일 09:00 ~ 18:00 (토·일·공휴일 휴무)</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-gray-100" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">매장 주소</p>
              <p className="text-sm font-semibold text-gray-800">서울 강서구 공항대로 195 힐스테이트에코동익 109호</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
