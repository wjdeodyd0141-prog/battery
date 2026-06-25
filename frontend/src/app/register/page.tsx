'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff, ChevronDown, ChevronUp, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

// ── 약관 내용 (대한민국 최신 표준 기준, 2024년) ────────
const TERMS_OF_SERVICE = `제1조 (목적)
이 약관은 파워뱅크 전시장(이하 "회사")가 운영하는 배터리 전문 전자상거래 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 사이의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "서비스"란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말하며, 아울러 사이버몰을 운영하는 사업자의 의미로도 사용합니다.
② "이용자"란 "서비스"에 접속하여 이 약관에 따라 "회사"가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
③ "회원"이란 "회사"에 개인정보를 제공하여 회원등록을 한 자로서, "회사"의 정보를 지속적으로 제공받으며 "회사"가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
④ "비회원"이란 회원에 가입하지 않고 "회사"가 제공하는 서비스를 이용하는 자를 말합니다.

제3조 (약관의 게시와 개정)
① 회사는 이 약관의 내용과 상호, 영업소 소재지, 대표자의 성명, 사업자등록번호, 연락처 등을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
② 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「소비자기본법」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
③ 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다. 다만, 이용자에게 불리한 약관의 개정의 경우에는 최소한 30일 이상의 사전 유예기간을 두고 공지합니다.

제4조 (서비스의 제공 및 변경)
① 회사는 다음과 같은 업무를 수행합니다.
  1. 재화 또는 용역에 대한 정보 제공 및 구매계약의 체결
  2. 구매계약이 체결된 재화 또는 용역의 배송
  3. 기타 회사가 정하는 업무
② 회사는 재화 또는 용역의 품절 또는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 재화 또는 용역의 내용을 변경할 수 있습니다.
③ 회사가 제공하기로 이용자와 계약을 체결한 서비스의 내용을 재화 등의 품절 또는 기술적 사양의 변경 등의 사유로 변경할 경우에는 그 사유를 이용자에게 통지 가능한 주소로 즉시 통지합니다.

제5조 (서비스의 중단)
① 회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
② 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.

제6조 (회원가입)
① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
② 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
  1. 가입신청자가 이 약관 제7조 제3항에 의하여 이전에 회원자격을 상실한 적이 있는 경우
  2. 등록 내용에 허위, 기재누락, 오기가 있는 경우
  3. 기타 회원으로 등록하는 것이 "서비스"의 기술상 현저히 지장이 있다고 판단되는 경우

제7조 (회원 탈퇴 및 자격 상실 등)
① 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.
② 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
  1. 가입 신청 시에 허위 내용을 등록한 경우
  2. 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우
  3. 서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우

제8조 (구매신청 및 개인정보 제공 동의 등)
① 이용자는 서비스상에서 다음 또는 이와 유사한 방법에 의하여 구매를 신청하며, 회사는 이용자가 구매신청을 함에 있어서 다음의 각 내용을 알기 쉽게 제공하여야 합니다.
  1. 재화 등의 검색 및 선택
  2. 성명, 주소, 전화번호, 전자우편주소(또는 이동전화번호) 등의 입력
  3. 약관 내용, 청약철회권이 제한되는 서비스, 배송료·설치비 등의 비용부담과 관련한 내용에 대한 확인
  4. 재화 등의 구매신청 및 이에 관한 확인 또는 회사의 확인에 대한 동의

제9조 (청약철회 등)
① 회사와 재화 등의 구매에 관한 계약을 체결한 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항에 따른 계약내용에 관한 서면을 받은 날(그 서면을 받은 때보다 재화 등의 공급이 늦게 이루어진 경우에는 재화 등을 공급받거나 공급이 시작된 날을 말합니다)부터 7일 이내에는 청약의 철회를 할 수 있습니다.
② 이용자는 재화 등을 배송받은 경우 다음 각 호의 1에 해당하는 경우에는 반품 및 교환을 할 수 없습니다.
  1. 이용자의 책임 있는 사유로 재화 등이 멸실 또는 훼손된 경우
  2. 이용자의 사용 또는 일부 소비에 의하여 재화 등의 가치가 현저히 감소한 경우

제10조 (개인정보보호)
회사는 이용자의 개인정보 수집 시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다. 회사는 회원가입 시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다. 다만, 관련 법령상 의무이행을 위하여 구매계약 이전에 본인확인이 필요한 경우로서 최소한의 특정 개인정보를 수집하는 경우에는 그러하지 아니합니다.

제11조 (분쟁해결)
① 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.
② 회사는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다.
③ 회사와 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.

제12조 (재판권 및 준거법)
① 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.
② 회사와 이용자 간에 제기된 전자상거래 소송에는 한국법을 적용합니다.

[시행일: 2024년 1월 1일]`;

const PRIVACY_POLICY = `파워뱅크 전시장(이하 "회사")는 「개인정보 보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.

제1조 (개인정보의 처리 목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
1. 홈페이지 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 목적으로 개인정보를 처리합니다.
2. 재화 또는 서비스 제공: 물품배송, 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산, 채권추심 목적으로 개인정보를 처리합니다.
3. 고충처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 목적으로 개인정보를 처리합니다.

제2조 (개인정보의 처리 및 보유 기간)
① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
  1. 홈페이지 회원 가입 및 관리: 사업자/단체 홈페이지 탈퇴 시까지
  다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지
    - 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우: 해당 수사·조사 종료 시까지
    - 홈페이지 이용에 따른 채권·채무관계 잔존 시: 해당 채권·채무관계 정산 시까지
  2. 재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료시까지
  다만, 다음의 사유에 해당하는 경우에는 해당 기간 종료 시까지
    - 「전자상거래 등에서의 소비자 보호에 관한 법률」에 따른 표시·광고, 계약내용 및 이행 등 거래에 관한 기록: 5년
    - 「전자상거래 등에서의 소비자 보호에 관한 법률」에 따른 소비자 불만 또는 분쟁처리에 관한 기록: 3년
    - 「통신비밀보호법」에 따른 로그인 기록: 3개월

제3조 (처리하는 개인정보 항목)
① 회사는 다음의 개인정보 항목을 처리하고 있습니다.
  1. 홈페이지 회원 가입 및 관리
    - 필수항목: 이메일, 비밀번호, 아이디
    - 선택항목: 이름, 전화번호, 주소
  2. 재화 또는 서비스 제공
    - 필수항목: 이름, 주소, 전화번호, 이메일
    - 선택항목: 없음
  3. 인터넷 서비스 이용 과정에서 아래 개인정보 항목이 자동으로 생성되어 수집될 수 있습니다.
    - IP 주소, 쿠키, MAC 주소, 서비스 이용기록, 방문기록, 불량 이용기록 등

제4조 (개인정보의 제3자 제공)
① 회사는 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
② 회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.
  - 제공받는 자: 배송 대행업체(CJ대한통운, 로젠택배 등)
  - 제공 목적: 상품 배송
  - 제공 항목: 수령인 이름, 주소, 전화번호
  - 보유 및 이용기간: 배송 완료 후 30일

제5조 (개인정보처리의 위탁)
① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
  - 위탁받는 자(수탁자): 결제대행사(토스페이먼츠)
  - 위탁하는 업무의 내용: 결제처리 및 결제취소
② 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.

제6조 (정보주체의 권리·의무 및 행사방법)
① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
  1. 개인정보 열람요구
  2. 오류 등이 있을 경우 정정 요구
  3. 삭제요구
  4. 처리정지 요구
② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.

제7조 (개인정보의 안전성 확보조치)
회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
1. 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등
2. 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치
3. 물리적 조치: 전산실, 자료보관실 등의 접근통제

제8조 (개인정보 보호책임자)
① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
  - 개인정보 보호책임자: 관리자
  - 연락처: admin@powerbankshow.kr

제9조 (개인정보 처리방침 변경)
이 개인정보처리방침은 2024년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.

[시행일: 2024년 1월 1일]`;

const MARKETING_POLICY = `■ 마케팅 정보 수신 동의 (선택)

수집·이용 목적
- 신상품 출시, 이벤트, 프로모션, 할인 쿠폰 등 마케팅 정보 제공
- 서비스 이용 분석 및 맞춤형 상품 추천

수집·이용 항목
- 이메일 주소, 휴대전화 번호

보유 및 이용 기간
- 동의 철회 시까지 (단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간)

발송 채널
- 이메일, 문자메시지(SMS/MMS), 앱 푸시 알림

※ 본 동의는 선택사항으로, 동의하지 않으셔도 서비스 이용에 불이익이 없습니다.
※ 동의 이후 수신 거부는 마이페이지 > 알림 설정 또는 수신된 메시지 내 수신거부 링크를 통해 언제든지 철회하실 수 있습니다.
※ 수신 거부 의사 표시 후 영업일 기준 3일 이내에 처리됩니다.`;

// ── 스텝 인디케이터 ───────────────────────────────────
const STEPS = ['약관동의', '정보입력', '가입완료'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < current ? 'bg-blue-600 text-white' :
              i === current ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs mt-1.5 font-medium ${i <= current ? 'text-blue-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mb-5 mx-1 transition-colors ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── 약관 항목 ─────────────────────────────────────────
function TermsItem({
  required, label, content, checked, onChange, href,
}: { required: boolean; label: string; content: string; checked: boolean; onChange: (v: boolean) => void; href?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
              checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
            }`}
          >
            {checked && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-sm font-medium text-gray-800 truncate">
            {required && <span className="text-blue-600 mr-1">[필수]</span>}
            {!required && <span className="text-gray-400 mr-1">[선택]</span>}
            {label}
          </span>
        </label>
        <div className="flex items-center gap-1 shrink-0">
          {href && (
            <Link href={href} target="_blank" className="text-xs text-blue-500 hover:underline px-1">
              전문보기
            </Link>
          )}
          <button type="button" onClick={() => setOpen((v) => !v)} className="p-1 text-gray-400 hover:text-gray-600">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="px-4 py-3 text-xs text-gray-500 leading-relaxed whitespace-pre-wrap bg-white max-h-40 overflow-y-auto border-t border-gray-100">
          {content}
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────
export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const handleKakaoLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    window.location.href = `${apiUrl}/auth/kakao`;
  };

  // 약관 동의
  const [terms, setTerms] = useState({ service: false, privacy: false, marketing: false });

  // 정보 입력
  const [form, setForm] = useState({ email: '', username: '', password: '', passwordConfirm: '', name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  const allRequired = terms.service && terms.privacy;
  const allAgreed = allRequired && terms.marketing;

  const toggleAll = (v: boolean) => setTerms({ service: v, privacy: v, marketing: v });

  // ── Step 1: 약관동의 ──
  const handleNextStep = () => {
    if (!terms.service) { toast.error('이용약관에 동의해주세요.'); return; }
    if (!terms.privacy) { toast.error('개인정보 수집·이용에 동의해주세요.'); return; }
    setStep(1);
  };

  // ── Step 2: 정보입력 → 회원가입 ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) { toast.error('이메일을 입력해주세요.'); return; }
    if (!form.username.trim()) { toast.error('아이디를 입력해주세요.'); return; }
    if (form.username.length < 4) { toast.error('아이디는 4자 이상이어야 합니다.'); return; }
    if (!form.password) { toast.error('비밀번호를 입력해주세요.'); return; }
    if (form.password.length < 8) { toast.error('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) { toast.error('비밀번호는 영문과 숫자를 포함해야 합니다.'); return; }
    if (form.password !== form.passwordConfirm) { toast.error('비밀번호가 일치하지 않습니다.'); return; }
    setLoading(true);
    try {
      await register({
        email: form.email,
        username: form.username,
        password: form.password,
        name: form.name || undefined,
        phone: form.phone || undefined,
        termsAgreed: terms.service,
        privacyAgreed: terms.privacy,
        marketingAgreed: terms.marketing,
      });
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const pwMatch = form.passwordConfirm && form.password !== form.passwordConfirm;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 왼쪽 비주얼 (데스크톱) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-700 items-center justify-center p-12">
        <div className="text-white max-w-sm">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <Zap className="w-9 h-9 text-white fill-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">파워뱅크 전시장<br></br> 회원이 되어보세요!</h2>
          <p className="text-blue-100 leading-relaxed text-lg">지금 가입하고 다양한 혜택을 누려보세요.</p>
          <div className="mt-10 space-y-3 text-sm text-blue-200">
            {['신규 회원 5% 할인 쿠폰 지급', '구매 내역 및 배송 현황 조회', '멤버십 포인트 적립'].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-blue-600">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              파워뱅크 전시장
            </Link>
          </div>

          <StepIndicator current={step} />

          {/* ── STEP 0: 약관동의 ── */}
          {step === 0 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">약관동의</h1>
                <p className="text-gray-500 mt-1.5 text-sm">서비스 이용을 위해 약관에 동의해주세요.</p>
              </div>

              {/* 전체 동의 */}
              <button
                type="button"
                onClick={() => toggleAll(!allAgreed)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 mb-4 transition-colors ${
                  allAgreed ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                  allAgreed ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                }`}>
                  {allAgreed && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-semibold text-gray-900">전체 동의 (선택 포함)</span>
              </button>

              <div className="space-y-2">
                <TermsItem
                  required
                  label="이용약관 동의"
                  content={TERMS_OF_SERVICE}
                  checked={terms.service}
                  onChange={(v) => setTerms({ ...terms, service: v })}
                  href="/terms"
                />
                <TermsItem
                  required
                  label="개인정보 수집·이용 동의"
                  content={PRIVACY_POLICY}
                  checked={terms.privacy}
                  onChange={(v) => setTerms({ ...terms, privacy: v })}
                  href="/privacy"
                />
                <TermsItem
                  required={false}
                  label="마케팅 정보 수신 동의"
                  content={MARKETING_POLICY}
                  checked={terms.marketing}
                  onChange={(v) => setTerms({ ...terms, marketing: v })}
                />
              </div>

              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!allRequired}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-base mt-6 disabled:opacity-40"
              >
                다음
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-50 px-3 text-gray-400">또는 간편 가입</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleKakaoLogin}
                className="w-full h-11 flex items-center justify-center gap-2.5 bg-[#FEE500] hover:bg-[#f0d800] rounded-xl font-semibold text-[#000000] text-sm transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.387c0 2.07 1.3 3.889 3.27 4.963l-.834 3.113a.281.281 0 0 0 .432.305L8.1 13.524c.294.04.593.063.9.063 4.142 0 7.5-2.634 7.5-5.887C16.5 4.134 13.142 1.5 9 1.5z" fill="#000000"/>
                </svg>
                카카오로 시작하기
              </button>

              <p className="text-sm text-gray-500 text-center mt-2">
                이미 계정이 있으신가요?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-semibold">로그인</Link>
              </p>
            </div>
          )}

          {/* ── STEP 1: 정보입력 ── */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">정보입력</h1>
                <p className="text-gray-500 mt-1.5 text-sm">계정 정보를 입력해주세요.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">이메일 <span className="text-blue-500">*</span></Label>
                  <Input type="email" placeholder="example@email.com" value={form.email} onChange={update('email')} className="h-11 rounded-xl border-gray-200" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">아이디 <span className="text-blue-500">*</span> <span className="text-gray-400 font-normal">(영문·숫자·_ 4~20자)</span></Label>
                  <Input placeholder="아이디 입력" value={form.username} onChange={update('username')} className="h-11 rounded-xl border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">비밀번호 <span className="text-blue-500">*</span> <span className="text-gray-400 font-normal">(영문+숫자 8자 이상)</span></Label>
                  <div className="relative">
                    <Input type={showPw ? 'text' : 'password'} placeholder="비밀번호 입력" value={form.password} onChange={update('password')} className="h-11 rounded-xl border-gray-200 pr-10" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPw((v) => !v)}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">비밀번호 확인 <span className="text-blue-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPwConfirm ? 'text' : 'password'}
                      placeholder="비밀번호 재입력"
                      value={form.passwordConfirm}
                      onChange={update('passwordConfirm')}
                      className={`h-11 rounded-xl pr-10 ${pwMatch ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPwConfirm((v) => !v)}>
                      {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwMatch && <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">이름 <span className="text-gray-400 font-normal">(선택)</span></Label>
                    <Input placeholder="홍길동" value={form.name} onChange={update('name')} className="h-11 rounded-xl border-gray-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">전화번호 <span className="text-gray-400 font-normal">(선택)</span></Label>
                    <Input placeholder="010-0000-0000" value={form.phone} onChange={update('phone')} className="h-11 rounded-xl border-gray-200" />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 h-11 rounded-xl">
                    이전
                  </Button>
                  <Button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold" disabled={loading}>
                    {loading ? '처리 중...' : '가입하기'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 2: 가입완료 ── */}
          {step === 2 && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">가입 완료!</h1>
              <p className="text-gray-500 mb-2">
                <span className="font-semibold text-gray-800">{form.name || form.username}</span>님, 환영합니다.
              </p>
              <p className="text-sm text-gray-400 mb-8">파워뱅크 전시장 회원이 되셨습니다.</p>

              {terms.marketing && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700 mb-6 text-left">
                  ✓ 마케팅 수신에 동의하셨습니다. 할인 쿠폰 및 이벤트 정보를 보내드릴게요!
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold"
                >
                  로그인하러 가기
                </Button>
                <Button variant="outline" onClick={() => router.push('/')} className="w-full h-11 rounded-xl">
                  쇼핑 시작하기
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
