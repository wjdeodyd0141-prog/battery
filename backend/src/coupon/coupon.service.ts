import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async createCoupon(data: {
    name: string;
    discountType: 'PERCENT' | 'AMOUNT';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    expiresAt?: string;
    triggerType?: 'NONE' | 'SIGNUP' | 'FIRST_PURCHASE';
  }) {
    return this.prisma.coupon.create({
      data: {
        name: data.name,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount ?? 0,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        triggerType: data.triggerType ?? 'NONE',
      },
    });
  }

  async issueByTrigger(userId: string, trigger: 'SIGNUP' | 'FIRST_PURCHASE') {
    const coupons = await this.prisma.coupon.findMany({
      where: { triggerType: trigger, isActive: true },
    });
    for (const coupon of coupons) {
      const exists = await this.prisma.userCoupon.findFirst({
        where: { couponId: coupon.id, userId },
      });
      if (!exists) {
        await this.prisma.userCoupon.create({ data: { couponId: coupon.id, userId } });
      }
    }
  }

  async listCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { userCoupons: true } } },
    });
  }

  async issueCoupon(couponId: string, userId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('쿠폰이 존재하지 않습니다.');

    const existing = await this.prisma.userCoupon.findFirst({ where: { couponId, userId } });
    if (existing) throw new BadRequestException('이미 발급된 쿠폰입니다.');

    return this.prisma.userCoupon.create({ data: { couponId, userId } });
  }

  async getMyCoupons(userId: string) {
    return this.prisma.userCoupon.findMany({
      where: { userId },
      include: { coupon: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.userCoupon.count({ where: { userId, isRead: false } });
  }

  async markAllRead(userId: string) {
    await this.prisma.userCoupon.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async getAdminUsers(search?: string) {
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: { id: true, username: true, name: true, email: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
