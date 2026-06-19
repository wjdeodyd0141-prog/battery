import Link from 'next/link';
import { Zap, Mail, Phone } from 'lucide-react';
import { Category } from '@/lib/types';

const SUPPORT_LINKS = [
  { href: '/my/orders', label: '주문/배송 조회' },
  { href: '/my', label: '마이페이지' },
];

async function getCategories(): Promise<Category[]> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const res = await fetch(`${base}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Footer() {
  const categories = await getCategories();
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* 브랜드 소개 */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-white mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              파워뱅크 전시장
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              고품질 배터리 전문 쇼핑몰 파워뱅크 전시장입니다.<br />
              리튬, 알카라인, 충전용 배터리 등 다양한 배터리를 합리적인 가격으로 제공합니다.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <span>1588-0000 (평일 09:00~18:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <span>support@powerbankshow.kr</span>
              </div>
            </div>
          </div>

          {/* 쇼핑 링크 */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">쇼핑</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">전체 상품</Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/products?categoryId=${cat.id}`} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length > 5 && (
                <li>
                  <Link href="/products" className="text-gray-600 hover:text-gray-400 transition-colors">
                    전체 카테고리 보기
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* 고객센터 링크 */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">고객센터</h3>
            <ul className="space-y-2.5 text-sm">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li><span className="text-gray-600">평일 09:00 ~ 18:00</span></li>
              <li><span className="text-gray-600">주말/공휴일 휴무</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© 2026 파워뱅크 전시장. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">이용약관</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
