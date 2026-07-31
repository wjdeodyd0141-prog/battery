import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateB2bInquiryDto {
  companyName: string;
  bizNumber: string;
  contactName: string;
  phone: string;
  content: string;
}

@Injectable()
export class B2bInquiriesService implements OnApplicationBootstrap {
  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "B2bInquiry" (
        "id"          TEXT        NOT NULL,
        "companyName" TEXT        NOT NULL,
        "bizNumber"   TEXT        NOT NULL,
        "contactName" TEXT        NOT NULL,
        "phone"       TEXT        NOT NULL,
        "content"     TEXT        NOT NULL,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "B2bInquiry_pkey" PRIMARY KEY ("id")
      )
    `;
  }

  create(data: CreateB2bInquiryDto) {
    return this.prisma.b2bInquiry.create({ data });
  }

  findAll() {
    return this.prisma.b2bInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
