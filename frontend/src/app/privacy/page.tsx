export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
          <p className="text-sm text-gray-400 mb-8">시행일: 2024년 1월 1일 | 최종 수정일: 2024년 1월 1일</p>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

            <p>
              파워뱅크 전시장(이하 "회사")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제1조 (개인정보의 처리목적)</h2>
              <p className="mb-2">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li><strong>회원가입 및 관리:</strong> 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 목적으로 처리합니다.</li>
                <li><strong>재화 또는 서비스 제공:</strong> 물품 배송, 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산 목적으로 처리합니다.</li>
                <li><strong>고충처리:</strong> 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 목적으로 처리합니다.</li>
                <li><strong>마케팅 및 광고에의 활용(선택):</strong> 신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재, 서비스의 유효성 확인, 접속빈도 파악 또는 회원의 서비스 이용에 대한 통계 목적으로 처리합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제2조 (개인정보의 처리 및 보유기간)</h2>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
                  <ul className="list-disc list-inside pl-4 mt-2 space-y-1.5">
                    <li><strong>회원 가입 및 관리:</strong> 서비스 이용계약 또는 회원가입 해지 시까지. 단, 다음 사유에 해당하는 경우에는 해당 기간 종료 시까지
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li>관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우: 해당 수사·조사 종료 시까지</li>
                        <li>서비스 이용에 따른 채권·채무관계 잔존 시: 해당 채권·채무관계 정산 시까지</li>
                      </ul>
                    </li>
                    <li><strong>재화 또는 서비스 제공:</strong> 재화·서비스 공급완료 및 요금결제·정산 완료 시까지. 단, 다음의 경우에는 해당 기간 종료 시까지
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li>「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 표시·광고, 계약내용 및 이행 등 거래에 관한 기록: 5년</li>
                        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                        <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                        <li>「통신비밀보호법」에 따른 웹사이트 방문기록: 3개월</li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제3조 (처리하는 개인정보의 항목)</h2>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li><strong>필수항목:</strong> 성명, 아이디(이메일), 비밀번호, 전화번호, 주소</li>
                <li><strong>선택항목:</strong> 마케팅 수신 동의</li>
                <li><strong>서비스 이용 시 자동 생성:</strong> IP주소, 쿠키, 서비스 이용기록, 방문기록, 불량이용기록 등</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제4조 (개인정보의 제3자 제공)</h2>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</li>
                <li>회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.
                  <div className="mt-2 overflow-x-auto">
                    <table className="text-xs border border-gray-200 w-full rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border-b border-gray-200 font-semibold">제공받는 자</th>
                          <th className="text-left p-2 border-b border-gray-200 font-semibold">제공목적</th>
                          <th className="text-left p-2 border-b border-gray-200 font-semibold">제공항목</th>
                          <th className="text-left p-2 border-b border-gray-200 font-semibold">보유기간</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border-b border-gray-100">택배사(CJ대한통운 등)</td>
                          <td className="p-2 border-b border-gray-100">상품 배송</td>
                          <td className="p-2 border-b border-gray-100">성명, 주소, 전화번호</td>
                          <td className="p-2 border-b border-gray-100">배송 완료 후 30일</td>
                        </tr>
                        <tr>
                          <td className="p-2">결제대행사(토스페이먼츠)</td>
                          <td className="p-2">결제 처리</td>
                          <td className="p-2">성명, 결제정보</td>
                          <td className="p-2">거래 완료 후 5년</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제5조 (개인정보처리의 위탁)</h2>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
                  <div className="mt-2 overflow-x-auto">
                    <table className="text-xs border border-gray-200 w-full rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border-b border-gray-200 font-semibold">수탁업체</th>
                          <th className="text-left p-2 border-b border-gray-200 font-semibold">위탁업무 내용</th>
                          <th className="text-left p-2 border-b border-gray-200 font-semibold">보유 및 이용기간</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border-b border-gray-100">토스페이먼츠</td>
                          <td className="p-2 border-b border-gray-100">결제 처리 및 관련 민원처리</td>
                          <td className="p-2 border-b border-gray-100">위탁계약 종료 시까지</td>
                        </tr>
                        <tr>
                          <td className="p-2">Amazon Web Services(AWS)</td>
                          <td className="p-2">서버 운영 및 데이터 보관</td>
                          <td className="p-2">위탁계약 종료 시까지</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </li>
                <li>회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제6조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h2>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.</li>
                <li>제1항에 따른 권리 행사는 회사에 대해 「개인정보 보호법」 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.</li>
                <li>정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</li>
                <li>제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 「개인정보 보호법」 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제7조 (개인정보의 파기)</h2>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
                <li>정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</li>
                <li>개인정보 파기의 절차 및 방법은 다음과 같습니다.
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                    <li><strong>파기절차:</strong> 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                    <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제8조 (개인정보의 안전성 확보조치)</h2>
              <p className="mb-2">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li><strong>관리적 조치:</strong> 내부관리계획 수립·시행, 정기적 직원 교육</li>
                <li><strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                <li><strong>물리적 조치:</strong> 전산실, 자료보관실 등의 접근통제</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제9조 (개인정보 보호책임자)</h2>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 개인정보 관련 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                  <div className="mt-2 bg-gray-50 rounded-lg p-4 text-sm">
                    <p><strong>개인정보 보호책임자</strong></p>
                    <p className="mt-1">성명: 파워뱅크 전시장 관리자</p>
                    <p>연락처: auddls0109@gmail.com</p>
                  </div>
                </li>
                <li>정보주체께서는 회사의 서비스(또는 사업)을 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체없이 답변 및 처리해드릴 것입니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제10조 (개인정보처리방침 변경)</h2>
              <p>이 개인정보처리방침은 2024년 1월 1일부터 적용됩니다. 이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">제11조 (권익침해 구제방법)</h2>
              <p className="mb-2">정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>개인정보 침해신고센터 (한국인터넷진흥원 운영): (국번없이) 118</li>
                <li>개인정보분쟁조정위원회: (국번없이) 1833-6972</li>
                <li>대검찰청 사이버범죄수사단: 02-3480-3573</li>
                <li>경찰청 사이버안전국: (국번없이) 182</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
