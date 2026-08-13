import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'B2B 기업 문의',
  description: '파워뱅크 전시장 기업 대량구매 문의 페이지입니다. 기업·단체·관공서 대상 특별 견적 및 납품 상담을 도와드립니다.',
  openGraph: {
    title: 'B2B 기업 문의 | 파워뱅크 전시장',
    description: '기업·단체·관공서 대상 특별 견적 및 납품 상담을 도와드립니다.',
  },
};

export default function B2bLayout({ children }: { children: React.ReactNode }) {
  return children;
}
