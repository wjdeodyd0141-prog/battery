import { Metadata } from 'next';

export const metadata: Metadata = { title: '배송 안내' };

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">배송 안내</h1>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">배송비</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>전 제품 무료배송</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">배송 기간</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>오후 3시 이전 결제 완료: 당일 발송</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>오후 3시 이후 결제 완료: 익일 발송</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>수령까지 평균 1~3 영업일 소요</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>주말·공휴일은 발송 제외 (다음 영업일 발송)</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">배송사</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>배터리 제품: 경동택배</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>그 외 제품: CJ대한통운</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>운송장 번호는 발송 후 마이페이지에서 확인 가능</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">유의사항</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>재고 상황에 따라 발송이 지연될 수 있으며, 지연 시 개별 연락드립니다.</span></li>
            <li className="flex gap-2"><span className="text-gray-400 shrink-0">·</span><span>배송 중 파손·오배송 시 고객센터로 연락 주시면 즉시 처리해드립니다.</span></li>
          </ul>
        </section>

        <section className="bg-gray-50 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">고객센터</h2>
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
