import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  findActive() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  findAll() {
    return this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.findOne(id);
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.banner.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('배너를 찾을 수 없습니다.');
    return banner;
  }
}
