import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('🌱 시드 데이터 입력 시작...');

  // 기존 데이터 정리 (순서 중요)
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ─── 유저 ────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin1234', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@funcamp.kr',
      username: 'admin',
      password: adminPassword,
      name: '관리자',
      phone: '010-1234-5678',
      role: 'ADMIN',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      username: 'user1',
      password: hashedPassword,
      name: '김철수',
      phone: '010-2345-6789',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      username: 'user2',
      password: hashedPassword,
      name: '이영희',
      phone: '010-3456-7890',
    },
  });

  console.log('✅ 유저 3명 생성');

  // ─── 카테고리 ─────────────────────────────────────
  const catLithium = await prisma.category.create({
    data: { name: '리튬 배터리', slug: 'lithium', description: '고성능 리튬 배터리' },
  });
  const catAlkaline = await prisma.category.create({
    data: { name: '알카라인 배터리', slug: 'alkaline', description: '일반 알카라인 배터리' },
  });
  const catRechargeable = await prisma.category.create({
    data: { name: '충전용 배터리', slug: 'rechargeable', description: '반복 충전 가능한 배터리' },
  });
  const catSpecial = await prisma.category.create({
    data: { name: '특수 배터리', slug: 'special', description: '카메라·의료기기용 특수 배터리' },
  });

  console.log('✅ 카테고리 4개 생성');

  // ─── 상품 ─────────────────────────────────────────
  const products = await Promise.all([
    // 리튬
    prisma.product.create({
      data: {
        name: '파나소닉 리튬 AA 배터리 4개입',
        slug: 'panasonic-lithium-aa-4',
        description: '파나소닉 고성능 리튬 배터리. 극한의 환경에서도 안정적인 성능을 발휘합니다. 디지털 카메라, 손전등에 최적.',
        price: 12900,
        stock: 150,
        categoryId: catLithium.id,
        imageUrls: [],
      },
    }),
    prisma.product.create({
      data: {
        name: '에너자이저 리튬 AAA 배터리 8개입',
        slug: 'energizer-lithium-aaa-8',
        description: '에너자이저 리튬 AAA 배터리. 일반 알카라인 대비 최대 8배 오래 지속됩니다.',
        price: 18500,
        stock: 80,
        categoryId: catLithium.id,
        imageUrls: [],
      },
    }),
    prisma.product.create({
      data: {
        name: '듀라셀 리튬 9V 배터리 2개입',
        slug: 'duracell-lithium-9v-2',
        description: '듀라셀 9V 리튬 배터리. 연기감지기, 무선 마이크에 적합.',
        price: 15900,
        stock: 60,
        categoryId: catLithium.id,
        imageUrls: [],
      },
    }),
    // 알카라인
    prisma.product.create({
      data: {
        name: '듀라셀 알카라인 AA 배터리 12개입',
        slug: 'duracell-alkaline-aa-12',
        description: '듀라셀 프리미엄 알카라인 AA 배터리 12개입. 일상 전자기기에 최적화.',
        price: 13900,
        stock: 300,
        categoryId: catAlkaline.id,
        imageUrls: [],
      },
    }),
    prisma.product.create({
      data: {
        name: '에너자이저 맥스 알카라인 AAA 배터리 10개입',
        slug: 'energizer-max-alkaline-aaa-10',
        description: '에너자이저 맥스 알카라인 AAA. 리모컨, 시계, 소형 기기에 적합.',
        price: 11500,
        stock: 250,
        categoryId: catAlkaline.id,
        imageUrls: [],
      },
    }),
    prisma.product.create({
      data: {
        name: '삼성 알카라인 AA 배터리 20개입',
        slug: 'samsung-alkaline-aa-20',
        description: '삼성 알카라인 AA 대용량 팩. 가성비 좋은 일상용 배터리.',
        price: 16900,
        stock: 400,
        categoryId: catAlkaline.id,
        imageUrls: [],
      },
    }),
    // 충전용
    prisma.product.create({
      data: {
        name: '에네루프 충전용 AA 배터리 4개 + 충전기 세트',
        slug: 'eneloop-aa-4-charger-set',
        description: '파나소닉 에네루프 충전용 AA 배터리 4개와 스마트 충전기 세트. 최대 2100회 충전 가능.',
        price: 39900,
        stock: 45,
        categoryId: catRechargeable.id,
        imageUrls: [],
      },
    }),
    prisma.product.create({
      data: {
        name: '에네루프 충전용 AAA 배터리 4개입',
        slug: 'eneloop-aaa-4',
        description: '파나소닉 에네루프 충전용 AAA. 장기 보관 후에도 80% 충전 유지.',
        price: 19900,
        stock: 90,
        categoryId: catRechargeable.id,
        imageUrls: [],
      },
    }),
    prisma.product.create({
      data: {
        name: 'GP 충전용 9V 배터리 2개 + 충전기',
        slug: 'gp-rechargeable-9v-charger',
        description: 'GP 충전용 9V 배터리. 연기감지기, 무선기기에 경제적.',
        price: 29900,
        stock: 30,
        categoryId: catRechargeable.id,
        imageUrls: [],
      },
    }),
    // 특수
    prisma.product.create({
      data: {
        name: '소니 CR2032 코인 배터리 5개입',
        slug: 'sony-cr2032-5',
        description: '소니 CR2032 리튬 코인 배터리. 시계, 계산기, 키레스 엔트리에 사용.',
        price: 8900,
        stock: 200,
        categoryId: catSpecial.id,
        imageUrls: [],
      },
    }),
    prisma.product.create({
      data: {
        name: '파나소닉 CR123A 카메라 배터리 2개입',
        slug: 'panasonic-cr123a-2',
        description: '파나소닉 CR123A. 필름 카메라, 보안 카메라, 의료기기용.',
        price: 11900,
        stock: 70,
        categoryId: catSpecial.id,
        imageUrls: [],
      },
    }),
    prisma.product.create({
      data: {
        name: '듀라셀 보청기 배터리 675 8개입',
        slug: 'duracell-hearing-aid-675-8',
        description: '듀라셀 보청기 전용 675 배터리. 안정적이고 오래가는 보청기 배터리.',
        price: 14900,
        stock: 5,
        categoryId: catSpecial.id,
        imageUrls: [],
      },
    }),
  ]);

  console.log(`✅ 상품 ${products.length}개 생성`);

  // ─── 리뷰 ──────────────────────────────────────────
  const reviews = [
    { userId: user1.id, productId: products[0].id, rating: 5, content: '오래 가고 좋아요! 카메라에 쓰는데 3개월째 잘 쓰고 있습니다.' },
    { userId: user2.id, productId: products[0].id, rating: 4, content: '배송 빠르고 정품이네요. 가격 대비 만족합니다.' },
    { userId: user1.id, productId: products[3].id, rating: 5, content: '듀라셀 믿고 삽니다. 리모컨에 넣었는데 아직도 정정해요.' },
    { userId: user2.id, productId: products[6].id, rating: 5, content: '에네루프 최고! 충전기도 포함이라 바로 쓸 수 있어 좋아요.' },
    { userId: user1.id, productId: products[9].id, rating: 4, content: 'CR2032 딱 맞게 왔어요. 시계에 잘 쓰고 있습니다.' },
  ];

  for (const r of reviews) {
    await prisma.review.create({ data: { ...r, imageUrls: [] } });
  }

  console.log(`✅ 리뷰 ${reviews.length}개 생성`);

  // ─── 장바구니 ──────────────────────────────────────
  const cart = await prisma.cart.create({
    data: {
      userId: user1.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 2 },
          { productId: products[3].id, quantity: 1 },
        ],
      },
    },
  });

  console.log('✅ 장바구니 1개 생성');

  // ─── 주문 ──────────────────────────────────────────
  await prisma.order.create({
    data: {
      userId: user1.id,
      status: 'DELIVERED',
      totalAmount: 25800,
      shippingAddress: '서울시 강남구 테헤란로 123 456동 789호',
      receiverName: '김철수',
      receiverPhone: '010-2345-6789',
      orderId: 'ORDER-2026-001',
      paymentKey: 'test_paymentKey_001',
      paidAt: new Date('2026-06-01T10:00:00Z'),
      items: {
        create: [
          { productId: products[0].id, quantity: 2, price: 12900 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: user2.id,
      status: 'PAID',
      totalAmount: 39900,
      shippingAddress: '부산시 해운대구 해운대로 456 101동 202호',
      receiverName: '이영희',
      receiverPhone: '010-3456-7890',
      orderId: 'ORDER-2026-002',
      paymentKey: 'test_paymentKey_002',
      paidAt: new Date('2026-06-15T14:30:00Z'),
      items: {
        create: [
          { productId: products[6].id, quantity: 1, price: 39900 },
        ],
      },
    },
  });

  console.log('✅ 주문 2개 생성');

  console.log('\n🎉 시드 완료!');
  console.log('────────────────────────────────');
  console.log('👤 관리자 계정: admin / admin1234');
  console.log('👤 일반 계정:   user1 / password123');
  console.log('👤 일반 계정:   user2 / password123');
  console.log('────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
