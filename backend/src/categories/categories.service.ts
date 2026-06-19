import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

export { CreateCategoryDto };

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { products: { where: { isActive: true } } },
    });
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const last = await this.prisma.category.findFirst({ orderBy: { order: 'desc' } });
    return this.prisma.category.create({ data: { ...dto, order: (last?.order ?? -1) + 1 } });
  }

  update(id: string, dto: Partial<CreateCategoryDto>) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  async reorder(items: { id: string; order: number }[]) {
    await this.prisma.$transaction(
      items.map(item =>
        this.prisma.category.update({ where: { id: item.id }, data: { order: item.order } })
      )
    );
    return this.findAll();
  }
}
