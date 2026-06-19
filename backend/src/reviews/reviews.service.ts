import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IsString, IsInt, Min, Max, IsOptional, IsArray } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateReviewDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    return this.prisma.review.create({
      data: { userId, ...dto },
      include: { user: { select: { username: true, name: true } } },
    });
  }

  findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { username: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: { product: { select: { name: true, slug: true, imageUrls: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    if (!isAdmin && review.userId !== userId) throw new ForbiddenException('권한이 없습니다.');
    return this.prisma.review.delete({ where: { id } });
  }
}
