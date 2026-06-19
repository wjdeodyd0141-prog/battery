import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart-context';
import Header from '@/components/layout/header';
import CategoryNav from '@/components/layout/category-nav';
import Footer from '@/components/layout/footer';
import { Toaster } from '@/components/ui/sonner';

const geist = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: '파워뱅크 전시장 - 배터리 전문 쇼핑몰',
  description: '고품질 배터리 전문 쇼핑몰. 리튬, 알카라인, 충전용 배터리를 합리적인 가격으로.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={geist.variable}>
      <body className="antialiased flex flex-col min-h-screen bg-gray-50">
        <AuthProvider>
          <CartProvider>
            <Header />
            <Suspense fallback={<div className="h-10 border-b border-gray-100 bg-white" />}>
              <CategoryNav />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster richColors position="top-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
