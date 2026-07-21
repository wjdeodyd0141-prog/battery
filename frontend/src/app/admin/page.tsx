'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Tag, Users, ShoppingBag, MessageSquare, ImagePlay, Layers, ChevronRight, HelpCircle, Coins } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const menus = [
  { href: '/admin/banners', icon: ImagePlay, title: '배너 관리', desc: '메인 롤링 배너 등록/수정/삭제' },
  { href: '/admin/popups', icon: Layers, title: '팝업 관리', desc: '메인 화면 팝업 등록/수정/삭제' },
  { href: '/admin/products', icon: Package, title: '상품 관리', desc: '배터리 상품 등록/수정/삭제' },
  { href: '/admin/categories', icon: Tag, title: '카테고리 관리', desc: '카테고리 등록/수정/삭제' },
  { href: '/admin/orders', icon: ShoppingBag, title: '주문 관리', desc: '전체 주문 현황 확인' },
  { href: '/admin/users', icon: Users, title: '회원 관리', desc: '회원 목록 조회' },
  { href: '/admin/inquiry', icon: MessageSquare, title: '문의 관리', desc: '고객 문의 확인 및 답변' },
  { href: '/admin/faq', icon: HelpCircle, title: 'FAQ 관리', desc: '자주 묻는 질문 등록/수정/삭제' },
  { href: '/admin/mileage', icon: Coins, title: '마일리지 관리', desc: '적립률 설정 및 회원 마일리지 지급/차감' },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [user, loading]);

  if (loading || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">파워뱅크 전시장 관리 패널</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menus.map((menu) => (
          <Link key={menu.href} href={menu.href} className="bg-white rounded-xl border p-5 flex items-center gap-4 hover:border-blue-400 hover:shadow-sm transition-all group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <menu.icon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{menu.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{menu.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
