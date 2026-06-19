import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'site_auth';
const COOKIE_VALUE = 'granted_vkdnjqodzm';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 페이지와 API는 통과
  if (pathname.startsWith('/site-auth') || pathname.startsWith('/api/site-auth')) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === COOKIE_VALUE) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/site-auth', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
