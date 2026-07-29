import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateB2bInquiryDto {
  companyName: string;
  bizNumber: string;
  contactName: string;
  phone: string;
  content: string;
}

@Injectable()
export class B2bInquiriesService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateB2bInquiryDto) {
    return this.prisma.b2bInquiry.create({ data });
  }

  findAll() {
    return this.prisma.b2bInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
