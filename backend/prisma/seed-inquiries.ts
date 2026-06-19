import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  const user1 = await prisma.user.findUnique({ where: { username: 'user1' } });
  const user2 = await prisma.user.findUnique({ where: { username: 'user2' } });

  if (!admin || !user1 || !user2) {
    console.error('❌ 유저가 없습니다. 먼저 seed.ts를 실행해주세요.');
    process.exit(1);
  }

  await prisma.inquiryReply.deleteMany();
  await prisma.inquiry.deleteMany();
  console.log('🗑️  기존 문의 데이터 삭제');

  const data = [
    {
      userId: user1.id,
      title: '배터리 유통기한이 어떻게 되나요?',
      content: '구매하려는 리튬 배터리의 유통기한이 궁금합니다. 패키지에 표시가 따로 있나요? 장기 보관을 생각하고 있어서요.',
      isSecret: false,
      status: 'ANSWERED' as const,
      reply: { adminId: admin.id, content: '안녕하세요! 리튬 배터리는 제조일로부터 10년의 유통기한을 가지고 있습니다. 패키지 뒷면 하단에 제조연월이 표기되어 있으며, 서늘하고 건조한 곳에 보관하시면 성능을 오래 유지하실 수 있습니다. 감사합니다.' },
    },
    {
      userId: user2.id,
      title: '에네루프 충전기 호환 배터리 종류가 궁금해요',
      content: '에네루프 충전기 세트 구매를 고려 중인데, 다른 브랜드 충전용 배터리도 충전이 가능한지 알고 싶습니다.',
      isSecret: false,
      status: 'ANSWERED' as const,
      reply: { adminId: admin.id, content: '에네루프 충전기는 표준 Ni-MH 방식으로 동일 규격(AA, AAA)의 다른 브랜드 충전 배터리도 사용 가능합니다. 단, 최적의 성능과 안전을 위해 에네루프 배터리와 함께 사용하시는 것을 권장드립니다.' },
    },
    {
      userId: user1.id,
      title: '주문 후 배송은 얼마나 걸리나요?',
      content: '오늘 오전에 주문했는데 언제쯤 받을 수 있을까요? 급하게 필요한 상황입니다.',
      isSecret: false,
      status: 'ANSWERED' as const,
      reply: { adminId: admin.id, content: '오후 2시 이전 결제 완료 건은 당일 발송되며, 일반적으로 다음날 수령 가능합니다. 오후 2시 이후 주문은 익일 발송됩니다. 배송 조회는 마이페이지 > 주문내역에서 확인하실 수 있습니다.' },
    },
    {
      userId: user2.id,
      title: '대량 구매 할인이 가능한가요?',
      content: '회사에서 사무용으로 AA 배터리를 100개 이상 구매할 예정입니다. 대량 구매 할인이나 기업 구매 혜택이 있는지 문의드립니다.',
      isSecret: false,
      status: 'PENDING' as const,
    },
    {
      userId: user1.id,
      title: 'CR2032 배터리 두께 규격이 맞는지 확인 부탁드려요',
      content: '스마트키에 사용할 CR2032를 구매하려 하는데, 제품마다 두께가 조금씩 다른 걸로 알고 있어요. 판매하시는 제품의 두께(mm) 스펙을 알 수 있을까요?',
      isSecret: false,
      status: 'ANSWERED' as const,
      reply: { adminId: admin.id, content: '소니 CR2032의 규격은 직경 20mm, 두께 3.2mm로 국제 표준 규격입니다. 일반적인 스마트키, 리모컨, 시계에 모두 호환됩니다. 구체적인 기기 모델명을 알려주시면 추가로 확인해드리겠습니다.' },
    },
    {
      userId: user2.id,
      title: '잘못 주문했는데 취소 가능한가요?',
      content: '방금 전 AA 배터리를 주문했는데 AAA로 주문해야 했습니다. 아직 배송 전인데 취소하고 재주문할 수 있을까요?',
      isSecret: true,
      status: 'ANSWERED' as const,
      reply: { adminId: admin.id, content: '배송 전 주문 취소는 가능합니다. 마이페이지 > 주문내역에서 직접 취소하시거나, 고객센터로 연락 주시면 빠르게 처리해드리겠습니다. 불편을 드려 죄송합니다.' },
    },
    {
      userId: user1.id,
      title: '보청기 배터리 사이즈별 차이가 궁금합니다',
      content: '부모님 보청기에 사용할 배터리를 구매하려 하는데, 10, 13, 312, 675 사이즈 중 어떤 걸 사야 할지 모르겠어요. 확인 방법이 있을까요?',
      isSecret: false,
      status: 'PENDING' as const,
    },
    {
      userId: user2.id,
      title: '배터리 재활용 방법이 있나요?',
      content: '사용한 배터리를 그냥 버리기 찜찜한데, 올바른 폐배터리 처리 방법이 있으면 알려주세요.',
      isSecret: false,
      status: 'ANSWERED' as const,
      reply: { adminId: admin.id, content: '폐배터리는 일반 쓰레기로 버리지 마시고, 대형마트·편의점·주민센터에 설치된 폐건전지 수거함에 넣어주세요. 저희 매장 구매 고객분들께는 택배 반송 봉투를 요청하시면 무료로 보내드리고 있습니다.' },
    },
    {
      userId: user1.id,
      title: '9V 배터리 직렬 연결 시 주의사항이 있나요?',
      content: '악기 이펙터 페달에 9V 배터리 2개를 사용하는데, 직렬 연결해서 18V로 쓰는 경우 안전한지 궁금합니다.',
      isSecret: false,
      status: 'PENDING' as const,
    },
    {
      userId: user2.id,
      title: '비밀 문의드립니다 (주문 관련)',
      content: '개인 정보가 포함된 주문 관련 문의입니다. 지난달 주문 건 영수증 재발행이 가능한가요? 주문번호는 ORDER-2026-002 입니다.',
      isSecret: true,
      status: 'PENDING' as const,
    },
  ];

  for (const item of data) {
    const { reply, ...inquiryData } = item as any;
    const inquiry = await prisma.inquiry.create({ data: inquiryData });
    if (reply) {
      await prisma.inquiryReply.create({
        data: { inquiryId: inquiry.id, adminId: reply.adminId, content: reply.content },
      });
    }
  }

  console.log(`✅ 문의 ${data.length}개 생성 완료`);
  console.log(`   - 공개: ${data.filter(d => !d.isSecret).length}개`);
  console.log(`   - 비밀: ${data.filter(d => d.isSecret).length}개`);
  console.log(`   - 답변완료: ${data.filter(d => d.status === 'ANSWERED').length}개`);
  console.log(`   - 답변대기: ${data.filter(d => d.status === 'PENDING').length}개`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
