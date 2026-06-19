import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(categoryId?: string, search?: string, admin?: boolean, sort?: string, page?: number, limit?: number) {
    const isBest = sort === 'best';
    const where = {
      ...(admin ? {} : { isActive: true }),
      ...(categoryId && { categoryId }),
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
      ...(isBest && { orderItems: { some: {} } }),
    };
    const orderBy = isBest
      ? { orderItems: { _count: 'desc' as const } }
      : { createdAt: 'desc' as const };

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [total, products] = await Promise.all([
        this.prisma.product.count({ where }),
        this.prisma.product.findMany({
          where,
          include: { category: true, _count: { select: { orderItems: true } } },
          orderBy,
          skip,
          take: limit,
        }),
      ]);
      return { products, total, totalPages: Math.ceil(total / limit), page, limit };
    }

    return this.prisma.product.findMany({
      where,
      include: { category: true, _count: { select: { orderItems: true } } },
      orderBy,
    });
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        optionGroups: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
        reviews: {
          include: { user: { select: { username: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
