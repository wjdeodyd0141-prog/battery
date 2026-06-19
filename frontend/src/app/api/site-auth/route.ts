import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = 'vkdnjqodzm';
const COOKIE_NAME = 'site_auth';
const COOKIE_VALUE = 'granted_vkdnjqodzm';

export async function POST(request: NextRequest) {
  const { password, from } = await request.json();

  if (password !== PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: '/',
  });
  return response;
}
