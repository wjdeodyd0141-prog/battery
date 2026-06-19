import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  await prisma.banner.deleteMany();
  console.log('🗑️  기존 배너 삭제');

  const banners = [
    {
      imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1920&h=600&fit=crop&q=80',
      title: '고성능 포터블 파워스테이션',
      subtitle: '야외 캠핑부터 비상전원까지, FunCamp와 함께하세요',
      linkUrl: '/products',
      isActive: true,
      order: 0,
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1920&h=600&fit=crop&q=80',
      title: '자연과 함께하는 에너지 솔루션',
      subtitle: '태양광 패널 + 파워뱅크로 지속 가능한 전력을',
      linkUrl: '/products?sort=best',
      isActive: true,
      order: 1,
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1920&h=600&fit=crop&q=80',
      title: '신뢰할 수 있는 충전 파트너',
      subtitle: '블루에티, 잭커리, 에코플로우 공식 취급점',
      linkUrl: '/products',
      isActive: true,
      order: 2,
    },
  ];

  for (const banner of banners) {
    await prisma.banner.create({ data: banner });
  }

  console.log(`✅ 배너 ${banners.length}개 생성 완료`);
  banners.forEach((b, i) => console.log(`   ${i + 1}. ${b.title}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
