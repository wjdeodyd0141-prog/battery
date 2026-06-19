import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateGroupDto {
  name: string;
  required?: boolean;
  order?: number;
}

export interface CreateOptionDto {
  name: string;
  price?: number;
  order?: number;
}

@Injectable()
export class ProductOptionsService {
  constructor(private prisma: PrismaService) {}

  getGroups(productId: string) {
    return this.prisma.productOptionGroup.findMany({
      where: { productId },
      include: { options: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  }

  createGroup(productId: string, dto: CreateGroupDto) {
    return this.prisma.productOptionGroup.create({
      data: { productId, ...dto },
      include: { options: true },
    });
  }

  async updateGroup(groupId: string, dto: Partial<CreateGroupDto>) {
    await this.findGroup(groupId);
    return this.prisma.productOptionGroup.update({
      where: { id: groupId },
      data: dto,
      include: { options: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteGroup(groupId: string) {
    await this.findGroup(groupId);
    return this.prisma.productOptionGroup.delete({ where: { id: groupId } });
  }

  createOption(groupId: string, dto: CreateOptionDto) {
    return this.prisma.productOption.create({ data: { groupId, ...dto } });
  }

  async updateOption(optionId: string, dto: Partial<CreateOptionDto>) {
    return this.prisma.productOption.update({ where: { id: optionId }, data: dto });
  }

  async deleteOption(optionId: string) {
    return this.prisma.productOption.delete({ where: { id: optionId } });
  }

  private async findGroup(groupId: string) {
    const group = await this.prisma.productOptionGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('옵션 그룹을 찾을 수 없습니다.');
    return group;
  }
}
