/** @type {import('next').NextConfig} */
const BACKEND_URL = 'https://api.powerbankmall.co.kr/api';

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  env: {
    NEXT_PUBLIC_API_URL: BACKEND_URL,
  },
  // 브라우저 → /backend-api/* → Next.js 서버 → Railway
  // 쿠키가 프론트와 같은 도메인에서 처리되어 서드파티 쿠키 차단 문제 해결
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 클릭재킹 방지
          { key: 'X-Frame-Options', value: 'DENY' },
          // MIME 타입 스니핑 방지
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer 정보 최소화
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // XSS 필터 (구형 브라우저)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // 권한 정책 — 불필요한 브라우저 기능 차단
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
