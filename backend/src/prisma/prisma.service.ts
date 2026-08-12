import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    await this.$connect();
    // 스키마에 추가된 컬럼이 프로덕션 DB에 없을 경우를 대비한 안전 마이그레이션
    await this.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "couponDiscount" INTEGER NOT NULL DEFAULT 0`);
    await this.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "usedCouponId" TEXT`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
