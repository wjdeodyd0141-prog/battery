import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePopupDto {
  title: string;
  imageUrl?: string;
  content?: string;
  linkUrl?: string;
  isActive?: boolean;
  startAt?: string;
  endAt?: string;
}

@Injectable()
export class PopupsService {
  constructor(private prisma: PrismaService) {}

  getActivePopups() {
    const now = new Date();
    return this.prisma.popup.findMany({
      where: {
        isActive: true,
        OR: [
          { startAt: null },
          { startAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getAllPopups() {
    return this.prisma.popup.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreatePopupDto) {
    return this.prisma.popup.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        content: dto.content,
        linkUrl: dto.linkUrl,
        isActive: dto.isActive ?? true,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
      },
    });
  }

  async update(id: string, dto: Partial<CreatePopupDto>) {
    const popup = await this.prisma.popup.findUnique({ where: { id } });
    if (!popup) throw new NotFoundException('팝업을 찾을 수 없습니다.');
    return this.prisma.popup.update({
      where: { id },
      data: {
        ...dto,
        startAt: dto.startAt !== undefined ? (dto.startAt ? new Date(dto.startAt) : null) : undefined,
        endAt: dto.endAt !== undefined ? (dto.endAt ? new Date(dto.endAt) : null) : undefined,
      },
    });
  }

  async remove(id: string) {
    const popup = await this.prisma.popup.findUnique({ where: { id } });
    if (!popup) throw new NotFoundException('팝업을 찾을 수 없습니다.');
    return this.prisma.popup.delete({ where: { id } });
  }
}
