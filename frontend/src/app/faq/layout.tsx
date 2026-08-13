import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '자주 묻는 질문',
  description: '파워뱅크 전시장 자주 묻는 질문(FAQ)입니다. 배송, 교환/반품, 제품 관련 궁금한 사항을 확인하세요.',
  openGraph: {
    title: '자주 묻는 질문 | 파워뱅크 전시장',
    description: '배송, 교환/반품, 제품 관련 궁금한 사항을 확인하세요.',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
