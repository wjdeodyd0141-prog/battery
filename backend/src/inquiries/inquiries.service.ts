import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { ReplyInquiryDto } from './dto/reply-inquiry.dto';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  async findPublic() {
    return this.prisma.inquiry.findMany({
      where: { isSecret: false },
      include: {
        user: { select: { id: true, username: true, name: true } },
        reply: { include: { admin: { select: { id: true, username: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(userId: string, isAdmin: boolean) {
    const inquiries = await this.prisma.inquiry.findMany({
      include: {
        user: { select: { id: true, username: true, name: true } },
        reply: { include: { admin: { select: { id: true, username: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (isAdmin) return inquiries;

    // 본인 글이 아니면 content·reply 마스킹
    return inquiries.map((inq) =>
      inq.userId === userId ? inq : { ...inq, content: null, reply: null },
    );
  }

  async findOne(id: string, userId: string, isAdmin: boolean) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, name: true } },
        reply: { include: { admin: { select: { id: true, username: true, name: true } } } },
      },
    });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    if (!isAdmin && inquiry.userId !== userId)
      throw new ForbiddenException('본인의 문의만 확인할 수 있습니다.');
    return inquiry;
  }

  async create(userId: string, dto: CreateInquiryDto) {
    return this.prisma.inquiry.create({
      data: { ...dto, userId },
      include: {
        user: { select: { id: true, username: true, name: true } },
        reply: true,
      },
    });
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    if (!isAdmin && inquiry.userId !== userId) throw new ForbiddenException('접근 권한이 없습니다.');
    return this.prisma.inquiry.delete({ where: { id } });
  }

  async reply(inquiryId: string, adminId: string, dto: ReplyInquiryDto) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');

    await this.prisma.inquiryReply.upsert({
      where: { inquiryId },
      create: { inquiryId, adminId, content: dto.content },
      update: { content: dto.content, adminId },
    });

    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: 'ANSWERED' },
      include: {
        user: { select: { id: true, username: true, name: true } },
        reply: { include: { admin: { select: { id: true, username: true, name: true } } } },
      },
    });
  }

  async deleteReply(inquiryId: string) {
    await this.prisma.inquiryReply.delete({ where: { inquiryId } });
    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: 'PENDING' },
    });
  }
}
