import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'site_auth';
const COOKIE_VALUE = 'granted_vkdnjqodzm';

const PUBLIC_PATHS = ['/site-auth', '/api/site-auth', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === COOKIE_VALUE) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/site-auth';
  loginUrl.search = `from=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: '/:path*',
};
