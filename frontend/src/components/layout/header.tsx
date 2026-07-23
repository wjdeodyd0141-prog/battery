'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Menu, X, Zap, LogOut, Package, Settings, MessageSquare, LayoutDashboard, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart-context';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const NAV_LINKS: { href: string; label: string }[] = [];

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCoupons, setUnreadCoupons] = useState(0);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!user) { setUnreadCoupons(0); toastShownRef.current = false; return; }
    api.get<{ count: number }>('/coupons/unread-count')
      .then(r => {
        setUnreadCoupons(r.count);
        if (r.count > 0 && !toastShownRef.current) {
          toastShownRef.current = true;
          toast('🎫 새 쿠폰이 도착했습니다!', {
            description: `미사용 쿠폰 ${r.count}장`,
            action: { label: '확인하기', onClick: () => router.push('/my/coupons') },
            duration: 6000,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600" onClick={() => setMobileOpen(false)}>
            <img src="/logo.png" alt="파워뱅크 전시장" className="h-9 w-auto" />
            <span className="tracking-tight">파워뱅크 전시장</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 오른쪽 액션 */}
          <div className="flex items-center gap-1">
            {/* 관리자 대시보드 버튼 */}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors mr-1"
              >
                <LayoutDashboard className="w-4 h-4" />
                관리자
              </Link>
            )}
            {/* 쿠폰 알림 */}
            {user && (
              <Link
                href="/my/coupons"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="쿠폰함"
              >
                <Ticket className="w-5 h-5 text-gray-600" />
                {unreadCoupons > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 rounded-full">
                    {unreadCoupons > 9 ? '9+' : unreadCoupons}
                  </Badge>
                )}
              </Link>
            )}

            {/* 장바구니 */}
            <Link href="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {itemCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-blue-600 rounded-full">
                  {itemCount > 9 ? '9+' : itemCount}
                </Badge>
              )}
            </Link>

            {/* 유저 메뉴 (데스크톱) */}
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-lg">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                      <p className="text-xs text-gray-500">{user.email || ''}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" /> 마이페이지
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my/orders" className="flex items-center gap-2 cursor-pointer">
                        <Package className="w-4 h-4" /> 주문내역
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/inquiry" className="flex items-center gap-2 cursor-pointer">
                        <MessageSquare className="w-4 h-4" /> 문의내역
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" /> 관리자
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 flex items-center gap-2 cursor-pointer">
                      <LogOut className="w-4 h-4" /> 로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">로그인</Link>
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-lg" asChild>
                    <Link href="/register">회원가입</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* 모바일 햄버거 */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="메뉴"
            >
              {mobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm text-gray-500">{user.name || user.username}</div>
                <Link href="/my" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4" /> 마이페이지
                </Link>
                <Link href="/my/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <Package className="w-4 h-4" /> 주문내역
                </Link>
                <Link href="/inquiry" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <MessageSquare className="w-4 h-4" /> 문의내역
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4" /> 관리자
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full">
                  <LogOut className="w-4 h-4" /> 로그아웃
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>로그인</Link>
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>회원가입</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
