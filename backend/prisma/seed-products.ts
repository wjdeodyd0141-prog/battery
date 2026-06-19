import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const IMGS = (seed: number) => [`https://picsum.photos/seed/${seed}/600/600`];

const PRODUCTS_BY_SLUG: Record<string, Array<{ name: string; description: string; price: number; stock: number; imageSeeds: number[] }>> = {
  'bluetti': [
    { name: 'Bluetti AC200P 파워스테이션 2000W', description: '2000W 순정현파 인버터, 2000Wh LFP 배터리 탑재. 캠핑·정전 대비용 대용량 포터블 파워스테이션.', price: 1890000, stock: 15, imageSeeds: [10, 11] },
    { name: 'Bluetti EB70S 파워스테이션 800W', description: '716Wh 대용량, 800W 출력. 경량 설계로 캠핑·차박에 최적화된 중형 파워스테이션.', price: 650000, stock: 20, imageSeeds: [12, 13] },
    { name: 'Bluetti AC60 파워스테이션 600W', description: '403Wh 용량, IP65 방수·방진 인증. 야외 활동 및 비상 전원으로 활용 가능한 컴팩트 모델.', price: 590000, stock: 18, imageSeeds: [14, 15] },
    { name: 'Bluetti EP500Pro 홈 파워스테이션', description: '5100Wh 초대용량 LFP 배터리, 3000W 출력. 가정용 비상 전원 및 에너지 저장용.', price: 3990000, stock: 5, imageSeeds: [16, 17] },
    { name: 'Bluetti B230 확장 배터리팩', description: 'AC200P/AC300 전용 확장 배터리. 2048Wh LFP 배터리로 사용 시간 대폭 연장.', price: 1290000, stock: 10, imageSeeds: [18, 19] },
  ],
  'jackery': [
    { name: 'Jackery Explorer 1000 Pro', description: '1002Wh, 1000W 출력. 6개 포트 동시 출력, 1.8시간 고속충전 지원 프리미엄 파워스테이션.', price: 1090000, stock: 12, imageSeeds: [20, 21] },
    { name: 'Jackery Explorer 500', description: '518Wh 용량, 순정현파 500W 인버터. 가벼운 무게로 캠핑·등산에 적합한 베스트셀러 모델.', price: 580000, stock: 25, imageSeeds: [22, 23] },
    { name: 'Jackery Explorer 240 V2', description: '256Wh 소형 파워스테이션. 스마트폰·노트북·카메라 등 소형 기기 충전에 최적.', price: 290000, stock: 30, imageSeeds: [24, 25] },
    { name: 'Jackery Explorer 2000 Plus', description: '2042Wh 대용량, 3000W 출력. LFP 배터리로 10년 이상 사용 가능한 프리미엄 라인업.', price: 1990000, stock: 8, imageSeeds: [26, 27] },
    { name: 'Jackery Explorer 300 Plus', description: '288Wh, 300W 출력. 소형이지만 AC·USB-C·DC 포트 모두 탑재한 올인원 소형 파워팩.', price: 320000, stock: 22, imageSeeds: [28, 29] },
  ],
  'diyfactory': [
    { name: '다이팩토리 파워뱅크 Pro 500Wh', description: '500Wh LFP 배터리, 500W 순정현파 출력. 합리적인 가격의 국산 캠핑용 파워스테이션.', price: 420000, stock: 20, imageSeeds: [30, 31] },
    { name: '다이팩토리 LFP 배터리팩 1000Wh', description: '1000Wh 대용량, 모듈형 구조로 직접 조립·확장 가능한 DIY 배터리 솔루션.', price: 750000, stock: 15, imageSeeds: [32, 33] },
    { name: '다이팩토리 캠핑 전원 200Wh', description: '200Wh 경량 파워팩. 1박 2일 캠핑에 딱 맞는 입문용 포터블 배터리.', price: 180000, stock: 35, imageSeeds: [34, 35] },
    { name: '다이팩토리 DIY 배터리 키트 100Ah', description: '100Ah LFP 셀 + BMS + 케이스 패키지. 자동차·캠핑카 자작 배터리 제작용 키트.', price: 390000, stock: 12, imageSeeds: [36, 37] },
    { name: '다이팩토리 소형 파워팩 100Wh', description: '100Wh 초소형 배터리. 스마트폰 20회 이상 충전 가능한 휴대용 보조배터리.', price: 99000, stock: 50, imageSeeds: [38, 39] },
  ],
  'ecoflow': [
    { name: 'EcoFlow DELTA 2', description: '1024Wh, 1800W 출력. X-Stream 기술로 80분 완충. 13가지 출력 포트를 갖춘 베스트 파워스테이션.', price: 1190000, stock: 14, imageSeeds: [40, 41] },
    { name: 'EcoFlow RIVER 2 Pro', description: '768Wh, 800W 출력. 70분 고속충전, 10개 출력 포트. 차박·캠핑 전용 미드레인지 모델.', price: 790000, stock: 18, imageSeeds: [42, 43] },
    { name: 'EcoFlow DELTA Max', description: '2016Wh 대용량, 2400W 출력. 확장 배터리 연결로 최대 6048Wh까지 확장 가능.', price: 1890000, stock: 7, imageSeeds: [44, 45] },
    { name: 'EcoFlow RIVER Mini', description: '210Wh 초소형, 300W 출력. 무게 2.8kg로 가장 가벼운 EcoFlow 모델. 일상 휴대용.', price: 250000, stock: 28, imageSeeds: [46, 47] },
    { name: 'EcoFlow DELTA Pro', description: '3600Wh, 3600W 출력. 스마트 홈 에너지 관리 시스템과 연동 가능한 최상위 모델.', price: 3490000, stock: 6, imageSeeds: [48, 49] },
  ],
  'mdhong': [
    { name: 'MD홍 파워스테이션 1000W', description: '960Wh 대용량 LFP 배터리. 합리적인 가격으로 장기간 사용 가능한 국내 브랜드 파워스테이션.', price: 680000, stock: 20, imageSeeds: [50, 51] },
    { name: 'MD홍 캠핑 배터리 500Wh', description: '480Wh, 500W 출력. 1박 2일 캠핑에 최적화된 중형 파워팩. 가성비 최고.', price: 350000, stock: 25, imageSeeds: [52, 53] },
    { name: 'MD홍 LFP 파워팩 300Wh', description: '288Wh LFP 배터리, 300W 순정현파 출력. 입문자를 위한 가성비 국산 파워팩.', price: 220000, stock: 30, imageSeeds: [54, 55] },
    { name: 'MD홍 미니 파워뱅크 200Wh', description: '192Wh 초소형 배터리팩. 200W 인버터 내장, 노트북·소형가전 구동 가능.', price: 159000, stock: 40, imageSeeds: [56, 57] },
    { name: 'MD홍 대용량 파워스테이션 2000W', description: '1920Wh 초대용량, 2000W 출력. 장기 캠핑·소규모 작업 현장용 국산 대형 파워스테이션.', price: 1390000, stock: 8, imageSeeds: [58, 59] },
  ],
  'jungwoo-powerbank': [
    { name: '정우 파워뱅크 500Wh Pro', description: '500Wh, 500W 출력. 정우 브랜드 프리미엄 라인업. BMS 4중 보호회로 탑재.', price: 390000, stock: 18, imageSeeds: [60, 61] },
    { name: '정우 캠핑 전원공급기 1000W', description: '960Wh LFP, 1000W 순정현파. 에어컨·전기장판 등 고출력 가전 구동 가능.', price: 720000, stock: 12, imageSeeds: [62, 63] },
    { name: '정우 스마트 파워뱅크 300Wh', description: 'BT 앱 연동, 충전 상태 실시간 모니터링. 300Wh 스마트 파워뱅크.', price: 249000, stock: 25, imageSeeds: [64, 65] },
    { name: '정우 고출력 파워팩 1500W', description: '1440Wh, 1500W 고출력 파워팩. 용접기·공구류 등 산업 현장에서도 활용 가능.', price: 980000, stock: 9, imageSeeds: [66, 67] },
    { name: '정우 컴팩트 파워뱅크 100Wh', description: '96Wh 초소형. 항공기 기내 반입 가능 용량. 여행·출장용 휴대 전원.', price: 89000, stock: 45, imageSeeds: [68, 69] },
  ],
  'car-charger': [
    { name: 'MPPT 스마트 주행충전기 20A', description: 'MPPT 제어 방식 20A 주행충전기. 차량 주행 중 리튬·AGM·납산 배터리 자동 충전.', price: 89000, stock: 30, imageSeeds: [70, 71] },
    { name: 'DC-DC 주행충전기 40A', description: '40A 고전류 DC-DC 컨버터. 캠핑카·차박 보조배터리 고속 충전 전용.', price: 159000, stock: 20, imageSeeds: [72, 73] },
    { name: '차량용 리튬 충전기 30A', description: '리튬(LFP) 전용 30A 주행충전기. BMS 연동으로 과충전 자동 차단.', price: 129000, stock: 22, imageSeeds: [74, 75] },
    { name: '듀얼 배터리 주행충전기 12V/24V', description: '12V/24V 겸용, 듀얼 배터리 동시 관리. 트럭·버스·캠핑카용 전문 충전기.', price: 79000, stock: 35, imageSeeds: [76, 77] },
    { name: '고출력 주행충전기 60A', description: '60A 대전류 출력. 빠른 충전이 필요한 대용량 파워스테이션 차량 충전 전용.', price: 210000, stock: 12, imageSeeds: [78, 79] },
  ],
  'kepco-charger': [
    { name: '가정용 AC 고속충전기 2000W', description: '220V 가정용 콘센트 연결, 2000W 고속충전. 대부분의 파워스테이션 고속충전 지원.', price: 69000, stock: 40, imageSeeds: [80, 81] },
    { name: '한전 연결 3000W 충전 스테이션', description: '3000W 최대 출력, 한전 계통 직결형. 대용량 파워스테이션 전용 초고속 충전기.', price: 180000, stock: 15, imageSeeds: [82, 83] },
    { name: '스마트 AC 멀티충전기 1500W', description: '1500W 스마트 충전기. 자동 전압 감지, 과충전·과열 자동 차단 기능.', price: 55000, stock: 50, imageSeeds: [84, 85] },
    { name: '가정용 4포트 멀티 충전 스테이션', description: '4개 기기 동시 충전, 총 2400W 출력. 가정 내 모든 파워뱅크를 한 번에 충전.', price: 95000, stock: 28, imageSeeds: [86, 87] },
    { name: '교류 전원 배터리 충전기 1000W', description: '범용 1000W AC 충전기. XT60·DC5525·Anderson 커넥터 포함 패키지.', price: 42000, stock: 60, imageSeeds: [88, 89] },
  ],
  'inverter': [
    { name: '순정현파 인버터 1000W', description: '1000W 순정현파(Pure Sine Wave) 출력. 민감한 전자기기·의료기기도 안전하게 사용 가능.', price: 120000, stock: 25, imageSeeds: [90, 91] },
    { name: '수정현파 인버터 500W', description: '500W 수정현파 인버터. 소형 가전·조명·공구 구동용 경제적인 선택.', price: 45000, stock: 40, imageSeeds: [92, 93] },
    { name: '고출력 순정현파 인버터 2000W', description: '2000W 순정현파 출력. 에어컨·전자레인지·커피머신 등 고전력 가전 구동 가능.', price: 250000, stock: 15, imageSeeds: [94, 95] },
    { name: '차량용 소형 인버터 300W', description: '시거잭 연결 300W 차량용 인버터. USB·AC 포트 동시 사용 가능한 휴대용 모델.', price: 29000, stock: 60, imageSeeds: [96, 97] },
    { name: '산업용 순정현파 인버터 3000W', description: '3000W 산업용 등급. 작업 현장·농업·소규모 사업장 전원 공급용 고신뢰성 인버터.', price: 390000, stock: 8, imageSeeds: [98, 99] },
  ],
  'solar-panel': [
    { name: '200W 모노크리스탈 태양광 패널', description: '22% 고효율 모노크리스탈 셀. 리지드 타입으로 지붕·캠핑카 고정 설치에 최적.', price: 220000, stock: 20, imageSeeds: [100, 101] },
    { name: '100W 폴더블 태양광 패널', description: '접이식 경량 설계, 무게 2.5kg. 캠핑·등산 등 이동형 야외 활동 전용 솔라패널.', price: 159000, stock: 30, imageSeeds: [102, 103] },
    { name: '400W 고효율 태양광 패널', description: '400W 대출력 모노크리스탈 패널. 가정용 소규모 태양광 발전 시스템 구성용.', price: 380000, stock: 12, imageSeeds: [104, 105] },
    { name: '60W 초경량 태양광 패널', description: '무게 1.2kg 초경량. 백팩에 부착 가능한 유연한 ETFE 소재 솔라패널.', price: 89000, stock: 35, imageSeeds: [106, 107] },
    { name: '300W 리지드 태양광 패널', description: '300W 알루미늄 프레임 리지드 패널. IP68 방수, 강화유리 적용 내구성 최고.', price: 299000, stock: 18, imageSeeds: [108, 109] },
  ],
};

async function main() {
  // 기존 연관 데이터 삭제
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  console.log('🗑️  기존 상품 데이터 삭제 완료');

  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.error('❌ 카테고리가 없습니다. seed-categories.ts를 먼저 실행해주세요.');
    process.exit(1);
  }

  let total = 0;
  for (const cat of categories) {
    const products = PRODUCTS_BY_SLUG[cat.slug];
    if (!products) {
      console.warn(`⚠️  [${cat.name}] 슬러그(${cat.slug})에 해당하는 상품 데이터 없음`);
      continue;
    }
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const slug = `${cat.slug}-${i + 1}`;
      await prisma.product.create({
        data: {
          name: p.name,
          slug,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrls: p.imageSeeds.map(s => `https://picsum.photos/seed/${s}/600/600`),
          detailImageUrls: [],
          isActive: true,
          categoryId: cat.id,
        },
      });
      total++;
    }
    console.log(`✅ [${cat.name}] 5개 등록`);
  }

  console.log(`\n🎉 총 ${total}개 상품 생성 완료`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
