import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의게시판',
  description: '파워뱅크 전시장 문의게시판입니다. 제품, 배송, 결제 등 궁금한 사항을 남겨주시면 빠르게 답변 드리겠습니다.',
  openGraph: {
    title: '문의게시판 | 파워뱅크 전시장',
    description: '제품, 배송, 결제 등 궁금한 사항을 남겨주시면 빠르게 답변 드리겠습니다.',
  },
};

export default function InquiryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
