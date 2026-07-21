import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MileageService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mileageBalance: true },
    });
    return { balance: user?.mileageBalance ?? 0 };
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, history] = await Promise.all([
      this.prisma.mileageHistory.count({ where: { userId } }),
      this.prisma.mileageHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { history, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getDefaultRate(): Promise<number> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key: 'mileage_rate' } });
    return setting ? parseFloat(setting.value) : 1;
  }

  async setDefaultRate(rate: number) {
    if (rate < 0 || rate > 100) throw new BadRequestException('적립률은 0~100 사이여야 합니다.');
    await this.prisma.siteSetting.upsert({
      where: { key: 'mileage_rate' },
      update: { value: String(rate) },
      create: { key: 'mileage_rate', value: String(rate) },
    });
    return { rate };
  }

  async earnFromOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order) return;

    const defaultRate = await this.getDefaultRate();
    let totalEarn = 0;

    for (const item of order.items) {
      const rate = (item.product as any).mileageRate ?? defaultRate;
      if (rate <= 0) continue;
      totalEarn += Math.floor((item.price + item.optionPrice) * item.quantity * (rate / 100));
    }

    if (totalEarn <= 0) return;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: order.userId },
        data: { mileageBalance: { increment: totalEarn } },
      }),
      this.prisma.mileageHistory.create({
        data: {
          userId: order.userId,
          amount: totalEarn,
          type: 'EARN',
          reason: `구매 적립 (#${orderId.slice(0, 8).toUpperCase()})`,
          orderId,
        },
      }),
    ]);
  }

  async adminGrant(userId: string, amount: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if (amount < 0 && user.mileageBalance + amount < 0) {
      throw new BadRequestException('차감 금액이 보유 마일리지보다 많습니다.');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { mileageBalance: { increment: amount } },
      }),
      this.prisma.mileageHistory.create({
        data: { userId, amount, type: 'ADMIN', reason },
      }),
    ]);
    return { success: true };
  }

  async getAdminUserList(search?: string) {
    const where: any = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {};
    return this.prisma.user.findMany({
      where,
      select: { id: true, username: true, name: true, email: true, mileageBalance: true },
      orderBy: { mileageBalance: 'desc' },
      take: 50,
    });
  }
}
