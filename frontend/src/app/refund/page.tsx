import { Metadata } from 'next';

export const metadata: Metadata = { title: '취소/환불 정책' };

export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">취소 / 환불 정책</h1>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        {/* 주문 취소 */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">주문 취소</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>결제 완료 후 배송 준비 전: 100% 취소 가능</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>배송 중: 취소 불가 — 수령 후 반품으로 처리</span></li>
          </ul>
        </section>

        {/* 반품/교환 */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">반품 / 교환 (수령일로부터 7일 이내)</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-800 mb-2">반품 가능</p>
              <ul className="space-y-2">
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>제품 불량·파손·오배송 → 왕복 배송비 당사 부담</span></li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>단순 변심 → 왕복 배송비 고객 부담</span></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-800 mb-2">반품 불가</p>
              <ul className="space-y-2">
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>사용하거나 개봉한 배터리</span></li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>구성품 분실 또는 제품 훼손</span></li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>수령일로부터 7일 초과</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* 환불 */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">환불</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>반품 확인 후 3~5 영업일 이내 처리</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>신용카드 결제: 카드사 취소</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>계좌이체 결제: 환불 계좌로 입금</span></li>
          </ul>
        </section>

        {/* 고객센터 */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">고객센터</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>전화: 02-2668-3799</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>이메일: symict1@naver.com</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>업무시간 10시~19시 연중무휴</span></li>
          </ul>
        </section>

      </div>
    </div>
  );
}
