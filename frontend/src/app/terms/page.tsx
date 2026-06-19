export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
          <p className="text-sm text-gray-400 mb-8">시행일: 2024년 1월 1일</p>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제1조 (목적)</h2>
              <p>이 약관은 파워뱅크 전시장(이하 "회사")가 운영하는 배터리 전문 전자상거래 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 사이의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제2조 (정의)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>"서비스"란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.</li>
                <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                <li>"회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
                <li>"비회원"이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제3조 (약관의 게시와 개정)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>회사는 이 약관의 내용과 상호, 영업소 소재지, 대표자의 성명, 사업자등록번호, 연락처 등을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                <li>회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「소비자기본법」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
                <li>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 공지합니다. 다만, 이용자에게 불리한 내용의 개정은 최소 30일 이상의 사전 유예기간을 두고 공지합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제4조 (서비스의 제공 및 변경)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>회사는 다음과 같은 업무를 수행합니다.
                  <ol className="list-decimal list-inside pl-4 mt-1 space-y-1">
                    <li>재화 또는 용역에 대한 정보 제공 및 구매계약의 체결</li>
                    <li>구매계약이 체결된 재화 또는 용역의 배송</li>
                    <li>기타 회사가 정하는 업무</li>
                  </ol>
                </li>
                <li>회사는 재화 또는 용역의 품절 또는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 재화 또는 용역의 내용을 변경할 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제5조 (서비스의 중단)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                <li>회사는 제1항의 사유로 서비스 제공이 일시 중단됨으로 인하여 이용자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제6조 (회원가입)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
                <li>회사는 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
                  <ol className="list-decimal list-inside pl-4 mt-1 space-y-1">
                    <li>가입신청자가 이전에 회원자격을 상실한 적이 있는 경우</li>
                    <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                    <li>기타 회원으로 등록하는 것이 기술상 현저히 지장이 있다고 판단되는 경우</li>
                  </ol>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제7조 (회원 탈퇴 및 자격 상실)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.</li>
                <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
                  <ol className="list-decimal list-inside pl-4 mt-1 space-y-1">
                    <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                    <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 경우</li>
                    <li>서비스를 이용하여 법령 또는 이 약관이 금지하는 행위를 하는 경우</li>
                  </ol>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제8조 (청약철회 등)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>회사와 재화 등의 구매에 관한 계약을 체결한 이용자는 재화를 공급받은 날부터 7일 이내에 청약의 철회를 할 수 있습니다. (「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항)</li>
                <li>이용자는 재화를 배송받은 경우 다음 각 호에 해당하는 경우에는 반품 및 교환을 할 수 없습니다.
                  <ol className="list-decimal list-inside pl-4 mt-1 space-y-1">
                    <li>이용자의 책임 있는 사유로 재화 등이 멸실 또는 훼손된 경우</li>
                    <li>이용자의 사용으로 재화 등의 가치가 현저히 감소한 경우</li>
                    <li>시간이 지나 재판매가 곤란할 정도로 재화 등의 가치가 현저히 감소한 경우</li>
                  </ol>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제9조 (이용자의 의무)</h2>
              <p className="mb-2">이용자는 다음 행위를 하여서는 안 됩니다.</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>신청 또는 변경 시 허위 내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                <li>회사와 기타 제3자의 저작권 등 지식재산권에 대한 침해</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제10조 (분쟁해결)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</li>
                <li>회사와 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제11조 (재판권 및 준거법)</h2>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.</li>
                <li>회사와 이용자 간에 제기된 전자상거래 소송에는 한국법을 적용합니다.</li>
              </ol>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
