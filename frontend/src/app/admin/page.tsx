'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Tag, Users, ShoppingBag, MessageSquare, ImagePlay, Layers,
  ChevronRight, HelpCircle, Coins, Ticket, LayoutTemplate, AlertTriangle,
  TrendingUp, Clock, ShoppingCart, Inbox, Building2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface LowStockProduct { id: string; name: string; stock: number; }

interface DashboardStats {
  todayOrders: number;
  monthOrders: number;
  monthRevenue: number;
  pendingOrders: number;
  unansweredInquiries: number;
  lowStockProducts: LowStockProduct[];
}

const menus = [
  { href: '/admin/hero', icon: LayoutTemplate, title: '상단이미지 관리', desc: '홈 상단 배경 이미지 및 텍스트 설정' },
  { href: '/admin/banners', icon: ImagePlay, title: '배너 관리', desc: '메인 롤링 배너 등록/수정/삭제' },
  { href: '/admin/popups', icon: Layers, title: '팝업 관리', desc: '메인 화면 팝업 등록/수정/삭제' },
  { href: '/admin/products', icon: Package, title: '상품 관리', desc: '배터리 상품 등록/수정/삭제' },
  { href: '/admin/categories', icon: Tag, title: '카테고리 관리', desc: '카테고리 등록/수정/삭제' },
  { href: '/admin/orders', icon: ShoppingBag, title: '주문 관리', desc: '전체 주문 현황 확인' },
  { href: '/admin/users', icon: Users, title: '회원 관리', desc: '회원 목록 조회' },
  { href: '/admin/inquiry', icon: MessageSquare, title: '문의 관리', desc: '고객 문의 확인 및 답변' },
  { href: '/admin/faq', icon: HelpCircle, title: 'FAQ 관리', desc: '자주 묻는 질문 등록/수정/삭제' },
  { href: '/admin/mileage', icon: Coins, title: '마일리지 관리', desc: '적립률 설정 및 회원 마일리지 지급/차감' },
  { href: '/admin/coupons', icon: Ticket, title: '쿠폰 관리', desc: '쿠폰 생성 및 회원별 발급' },
  { href: '/admin/b2b', icon: Building2, title: 'B2B 구매 문의', desc: '기업·단체 대량 구매 문의 목록' },
];

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원'; }

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [user, loading]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get<DashboardStats>('/orders/dashboard').then(setDashStats).catch(() => {});
    }
  }, [user]);

  if (loading || !user || user.role !== 'ADMIN') return null;

  const now = new Date();
  const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  const summaryCards = [
    {
      icon: ShoppingCart,
      label: '오늘 신규 주문',
      value: dashStats ? `${dashStats.todayOrders}건` : '...',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/admin/orders',
    },
    {
      icon: TrendingUp,
      label: `이번 달 매출 (${monthLabel})`,
      value: dashStats ? fmt(dashStats.monthRevenue) : '...',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/admin/orders',
    },
    {
      icon: Clock,
      label: '결제 대기 주문',
      value: dashStats ? `${dashStats.pendingOrders}건` : '...',
      color: dashStats && dashStats.pendingOrders > 0 ? 'text-yellow-600' : 'text-gray-500',
      bg: dashStats && dashStats.pendingOrders > 0 ? 'bg-yellow-50' : 'bg-gray-50',
      href: '/admin/orders',
    },
    {
      icon: Inbox,
      label: '미답변 문의',
      value: dashStats ? `${dashStats.unansweredInquiries}건` : '...',
      color: dashStats && dashStats.unansweredInquiries > 0 ? 'text-red-600' : 'text-gray-500',
      bg: dashStats && dashStats.unansweredInquiries > 0 ? 'bg-red-50' : 'bg-gray-50',
      href: '/admin/inquiry',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">파워뱅크 전시장 관리 패널</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {summaryCards.map(c => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center`}>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      {/* 재고 부족 경고 */}
      {dashStats && dashStats.lowStockProducts.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm font-semibold text-amber-700">재고 부족 상품 ({dashStats.lowStockProducts.length}개)</p>
          </div>
          <div className="space-y-1.5">
            {dashStats.lowStockProducts.map(p => (
              <Link
                key={p.id}
                href="/admin/products"
                className="flex items-center justify-between text-sm hover:underline"
              >
                <span className="text-gray-700 truncate mr-2">{p.name}</span>
                <span className={`font-bold shrink-0 ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {p.stock === 0 ? '품절' : `${p.stock}개 남음`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 메뉴 */}
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
