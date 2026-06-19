import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // FK 순서에 맞게 관련 데이터 먼저 삭제
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log('🗑️  기존 카테고리 및 연관 상품 데이터 삭제 완료');

  const categories = [
    { name: '블루에티',      slug: 'bluetti' },
    { name: '잭커리',        slug: 'jackery' },
    { name: '다이팩토리',    slug: 'diyfactory' },
    { name: '에코플로우',    slug: 'ecoflow' },
    { name: 'MD홍',          slug: 'mdhong' },
    { name: '정우 파워뱅크', slug: 'jungwoo-powerbank' },
    { name: '주행충전기',    slug: 'car-charger' },
    { name: '한전충전기',    slug: 'kepco-charger' },
    { name: '인버터',        slug: 'inverter' },
    { name: '태양광패널',    slug: 'solar-panel' },
  ];

  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }

  console.log(`✅ 카테고리 ${categories.length}개 생성 완료`);
  categories.forEach((c, i) => console.log(`   ${i + 1}. ${c.name} (${c.slug})`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
