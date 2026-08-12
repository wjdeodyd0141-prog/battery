import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MileageService } from '../mileage/mileage.service';
import { OrderStatus } from '@prisma/client';

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CreateOrderDto {
  items: { productId: string; quantity: number; optionPrice?: number; selectedOptions?: SelectedOption[] }[];
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  shippingFee?: number;
  mileageUsed?: number;
  couponId?: string;
}

export interface OrderQueryDto {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mileageService: MileageService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // VULN-01: 상품과 옵션 정보를 DB에서 직접 조회
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map(i => i.productId) } },
      include: { optionGroups: { include: { options: true } } },
    });

    let itemsTotal = 0;
    const orderItems = dto.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new NotFoundException(`상품 ${item.productId}을 찾을 수 없습니다.`);
      if (!product.isActive) throw new BadRequestException(`${product.name}은 판매 중지된 상품입니다.`);
      if (product.stock < item.quantity) throw new BadRequestException(`${product.name} 재고가 부족합니다.`);

      // VULN-01: 클라이언트 optionPrice 무시 — DB에서 직접 계산
      let serverOptionPrice = 0;
      if (item.selectedOptions?.length) {
        for (const sel of item.selectedOptions) {
          const group = product.optionGroups.find(g => g.id === sel.groupId);
          const option = group?.options.find(o => o.id === sel.optionId);
          if (option) serverOptionPrice += option.price;
        }
      }

      itemsTotal += (product.price + serverOptionPrice) * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        optionPrice: serverOptionPrice,
        selectedOptions: (item.selectedOptions ?? []) as any,
      };
    });

    const shippingFee = 0;
    const totalAmount = itemsTotal + shippingFee;

    // 마일리지 검증
    const rawMileage = dto.mileageUsed ?? 0;
    if (!Number.isFinite(rawMileage)) throw new BadRequestException('유효하지 않은 마일리지 값입니다.');
    const mileageUsed = Math.max(0, Math.floor(rawMileage));
    if (mileageUsed > totalAmount) throw new BadRequestException('마일리지 사용 금액이 주문 금액을 초과합니다.');

    // 쿠폰 검증 및 할인 계산 (트랜잭션 외부에서 미리 조회)
    let couponDiscount = 0;
    let userCouponId: string | null = null;
    if (dto.couponId) {
      const userCoupon = await this.prisma.userCoupon.findFirst({
        where: { id: dto.couponId, userId, isUsed: false },
        include: { coupon: true },
      });
      if (!userCoupon) throw new BadRequestException('유효하지 않은 쿠폰입니다.');
      const coupon = userCoupon.coupon;
      if (!coupon.isActive) throw new BadRequestException('비활성화된 쿠폰입니다.');
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('만료된 쿠폰입니다.');
      if (totalAmount < coupon.minOrderAmount) throw new BadRequestException(`최소 주문 금액 ${coupon.minOrderAmount.toLocaleString()}원 이상 시 사용 가능합니다.`);

      if (coupon.discountType === 'PERCENT') {
        const raw = Math.floor(totalAmount * coupon.discountValue / 100);
        couponDiscount = coupon.maxDiscountAmount ? Math.min(raw, coupon.maxDiscountAmount) : raw;
      } else {
        couponDiscount = Math.min(Math.floor(coupon.discountValue), totalAmount);
      }
      userCouponId = userCoupon.id;
    }

    const amountAfterDiscounts = totalAmount - couponDiscount;
    if (mileageUsed > amountAfterDiscounts) throw new BadRequestException('마일리지 사용 금액이 주문 금액을 초과합니다.');

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          mileageUsed,
          ...(couponDiscount > 0 ? { couponDiscount } : {}),
          ...(userCouponId ? { usedCouponId: userCouponId } : {}),
          shippingAddress: dto.shippingAddress,
          receiverName: dto.receiverName,
          receiverPhone: dto.receiverPhone,
          items: { create: orderItems },
        },
        include: { items: { include: { product: true } } },
      });

      if (mileageUsed > 0) {
        const result = await tx.user.updateMany({
          where: { id: userId, mileageBalance: { gte: mileageUsed } },
          data: { mileageBalance: { decrement: mileageUsed } },
        });
        if (result.count === 0) throw new BadRequestException('마일리지가 부족합니다.');
        await tx.mileageHistory.create({
          data: {
            userId,
            amount: -mileageUsed,
            type: 'USE',
            reason: `결제 사용 (#${order.id.slice(0, 8).toUpperCase()})`,
            orderId: order.id,
          },
        });
      }

      return order;
    });
  }

  async confirmPayment(orderId: string, paymentKey: string, amount: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    const expectedAmount = order.totalAmount - (order.mileageUsed ?? 0) - (order.couponDiscount ?? 0);
    if (expectedAmount !== amount) throw new BadRequestException('결제 금액이 일치하지 않습니다.');

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) throw new BadRequestException('재고가 부족합니다.');
      }

      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      // 결제 완료 시점에 쿠폰 소비 처리
      if (order.usedCouponId) {
        await tx.userCoupon.update({
          where: { id: order.usedCouponId },
          data: { isUsed: true, usedAt: new Date() },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID', paymentKey, paidAt: new Date() },
        include: { items: { include: { product: true } } },
      });
    });
  }

  async completeFreeOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true } });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    const paymentAmount = order.totalAmount - (order.mileageUsed ?? 0) - (order.couponDiscount ?? 0);
    if (paymentAmount !== 0) throw new BadRequestException('마일리지/쿠폰으로 전액 결제된 주문이 아닙니다.');

    return this.prisma.$transaction(async (tx) => {
      // 상태 변경을 트랜잭션 내부에서 원자적으로 처리 — 동시 요청 방지
      const locked = await tx.order.updateMany({
        where: { id: orderId, userId, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (locked.count === 0) throw new BadRequestException('이미 처리된 주문입니다.');

      for (const item of order.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) throw new BadRequestException('재고가 부족합니다.');
      }
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (order.usedCouponId) {
        await tx.userCoupon.update({
          where: { id: order.usedCouponId },
          data: { isUsed: true, usedAt: new Date() },
        });
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });
    });
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    return order;
  }

  async getOrderByIdDirect(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
  }

  async getAdminOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, name: true, email: true, phone: true } },
      },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    return order;
  }

  async updateStatus(orderId: string, status: string) {
    const validStatuses: string[] = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) throw new BadRequestException('유효하지 않은 주문 상태입니다.');

    // CANCELLED 전환은 Toss 취소·재고복원·마일리지 환급을 포함한 전체 취소 흐름으로 처리
    if (status === 'CANCELLED') {
      return this.adminCancelOrder(orderId);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, name: true, email: true, phone: true } },
      },
    });
    if (status === 'DELIVERED') {
      this.mileageService.earnFromOrder(orderId).catch((err) => {
        console.error(`[Mileage] 배송완료 적립 실패 orderId=${orderId}`, err);
      });
    }
    return updated;
  }

  private async adminCancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestException('이미 취소 또는 환불된 주문입니다.');
    }

    if (order.paymentKey) {
      const tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY') ?? '';
      const encodedKey = Buffer.from(`${tossSecretKey}:`).toString('base64');
      const response = await fetch(`https://api.tosspayments.com/v1/payments/${order.paymentKey}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Basic ${encodedKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: '관리자 주문 취소' }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new BadRequestException(err.message || '결제 취소에 실패했습니다.');
      }
    }

    const earnedHistory = await this.prisma.mileageHistory.findFirst({
      where: { orderId, type: 'EARN', reason: { startsWith: '구매 적립' } },
    });

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      if (order.mileageUsed > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { mileageBalance: { increment: order.mileageUsed } },
        });
        await tx.mileageHistory.create({
          data: {
            userId: order.userId,
            amount: order.mileageUsed,
            type: 'EARN',
            reason: `주문 취소 마일리지 환급 (#${orderId.slice(0, 8).toUpperCase()})`,
            orderId,
          },
        });
      }
      if (earnedHistory && earnedHistory.amount > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { mileageBalance: { decrement: earnedHistory.amount } },
        });
        await tx.mileageHistory.create({
          data: {
            userId: order.userId,
            amount: -earnedHistory.amount,
            type: 'ADMIN',
            reason: `취소로 인한 구매 적립 회수 (#${orderId.slice(0, 8).toUpperCase()})`,
            orderId,
          },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, username: true, name: true, email: true, phone: true } },
        },
      });
    });
  }

  async updateTracking(orderId: string, trackingNumber: string, carrier: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        carrier,
        status: 'SHIPPED',
      },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, name: true, email: true, phone: true } },
      },
    });
  }

  async cancelOrderByUser(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (order.status !== 'PAID' && order.status !== 'PREPARING') {
      throw new BadRequestException('결제 완료 또는 준비 중 상태의 주문만 취소할 수 있습니다.');
    }

    // 토스 결제 취소 API 호출
    if (order.paymentKey) {
      const tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY') ?? '';
      const encodedKey = Buffer.from(`${tossSecretKey}:`).toString('base64');
      const response = await fetch(`https://api.tosspayments.com/v1/payments/${order.paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancelReason: '고객 요청 취소' }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new BadRequestException(err.message || '결제 취소에 실패했습니다.');
      }
    }

    // 재고 복원 + 상태 변경 + 마일리지 환급을 단일 트랜잭션으로 처리
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      if (order.mileageUsed > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { mileageBalance: { increment: order.mileageUsed } },
        });
        await tx.mileageHistory.create({
          data: {
            userId: order.userId,
            amount: order.mileageUsed,
            type: 'EARN',
            reason: `주문 취소 마일리지 환급 (#${orderId.slice(0, 8).toUpperCase()})`,
            orderId,
          },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: { items: { include: { product: true } } },
      });
    });
  }

  async deletePendingOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) return;
    if (order.status !== 'PENDING') return;
    await this.prisma.order.delete({ where: { id: orderId } });
  }

  async updateMemo(orderId: string, adminMemo: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { adminMemo },
    });
  }

  async refundOrder(orderId: string, cancelReason: string, cancelAmount?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (!['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException('환불 가능한 상태가 아닙니다.');
    }
    if (!order.paymentKey) {
      throw new BadRequestException('결제 정보가 없어 환불할 수 없습니다.');
    }

    const tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY') ?? '';
    if (!tossSecretKey) throw new BadRequestException('결제 키가 설정되지 않았습니다.');

    const encodedKey = Buffer.from(`${tossSecretKey}:`).toString('base64');
    const body: Record<string, unknown> = { cancelReason };
    if (cancelAmount && cancelAmount > 0) body.cancelAmount = cancelAmount;

    const response = await fetch(
      `https://api.tosspayments.com/v1/payments/${order.paymentKey}/cancel`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${encodedKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      throw new BadRequestException(err.message || '토스페이먼츠 환불 요청에 실패했습니다.');
    }

    const earnedHistory = await this.prisma.mileageHistory.findFirst({
      where: { orderId, type: 'EARN', reason: { startsWith: '구매 적립' } },
    });

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      if (order.mileageUsed > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { mileageBalance: { increment: order.mileageUsed } },
        });
        await tx.mileageHistory.create({
          data: {
            userId: order.userId,
            amount: order.mileageUsed,
            type: 'EARN',
            reason: `주문 환불 마일리지 환급 (#${orderId.slice(0, 8).toUpperCase()})`,
            orderId,
          },
        });
      }
      if (earnedHistory && earnedHistory.amount > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { mileageBalance: { decrement: earnedHistory.amount } },
        });
        await tx.mileageHistory.create({
          data: {
            userId: order.userId,
            amount: -earnedHistory.amount,
            type: 'ADMIN',
            reason: `환불로 인한 구매 적립 회수 (#${orderId.slice(0, 8).toUpperCase()})`,
            orderId,
          },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, username: true, name: true, email: true, phone: true } },
        },
      });
    });
  }

  private buildDateFilter(year?: number, month?: number) {
    if (!year || !month) return undefined;
    return {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  async getAllOrders(query: OrderQueryDto = {}) {
    const { status, search, page = 1, limit = 20, year, month } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    const dateFilter = this.buildDateFilter(year, month);
    if (dateFilter) where.createdAt = dateFilter;
    if (search) {
      where.OR = [
        { receiverName: { contains: search, mode: 'insensitive' } },
        { receiverPhone: { contains: search } },
        { id: { contains: search } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, username: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async exportOrders(year: number, month: number, status?: string) {
    const where: any = { createdAt: this.buildDateFilter(year, month) };
    if (status && status !== 'ALL') where.status = status;
    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { username: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestReturn(orderId: string, userId: string, returnType: 'RETURN' | 'EXCHANGE', returnReason: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (!['SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException('배송 중 또는 배송 완료 상태의 주문만 신청 가능합니다.');
    }
    if (order.returnStatus) {
      throw new BadRequestException('이미 반품/교환 신청이 접수되었습니다.');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        returnStatus: 'REQUESTED',
        returnType,
        returnReason,
        returnRequestedAt: new Date(),
      } as any,
      include: { items: { include: { product: true } } },
    });
  }

  async adminApproveReturn(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (order.returnStatus !== 'REQUESTED') {
      throw new BadRequestException('반품/교환 신청 상태의 주문만 승인할 수 있습니다.');
    }

    const returnType = order.returnType;

    if (returnType === 'RETURN' && order.paymentKey) {
      const tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY') ?? '';
      const encodedKey = Buffer.from(`${tossSecretKey}:`).toString('base64');
      const response = await fetch(
        `https://api.tosspayments.com/v1/payments/${order.paymentKey}/cancel`,
        {
          method: 'POST',
          headers: { Authorization: `Basic ${encodedKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelReason: '고객 반품 요청 승인' }),
        },
      );
      if (!response.ok) {
        const err = await response.json();
        throw new BadRequestException(err.message || '환불 처리에 실패했습니다.');
      }
      // 재고 복원 + 마일리지 환급 + 상태 변경을 단일 트랜잭션으로 처리
      return this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
        if (order.mileageUsed > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { mileageBalance: { increment: order.mileageUsed } },
          });
          await tx.mileageHistory.create({
            data: {
              userId: order.userId,
              amount: order.mileageUsed,
              type: 'EARN',
              reason: `반품 마일리지 환급 (#${orderId.slice(0, 8).toUpperCase()})`,
              orderId,
            },
          });
        }
        return tx.order.update({
          where: { id: orderId },
          data: { returnStatus: 'APPROVED', status: 'REFUNDED' } as any,
          include: {
            items: { include: { product: true } },
            user: { select: { id: true, username: true, name: true, email: true, phone: true } },
          },
        });
      });
    }

    // 교환인 경우 returnStatus만 APPROVED로 변경
    return this.prisma.order.update({
      where: { id: orderId },
      data: { returnStatus: 'APPROVED' } as any,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, name: true, email: true, phone: true } },
      },
    });
  }

  async adminRejectReturn(orderId: string, rejectReason: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (order.returnStatus !== 'REQUESTED') {
      throw new BadRequestException('반품/교환 신청 상태의 주문만 거절할 수 있습니다.');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { returnStatus: 'REJECTED', returnReason: rejectReason } as any,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, name: true, email: true, phone: true } },
      },
    });
  }

  async getReturnRequests() {
    return this.prisma.order.findMany({
      where: { returnStatus: { not: null } } as any,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, name: true, email: true, phone: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getOrderStats(year?: number, month?: number) {
    const dateFilter = this.buildDateFilter(year, month);
    const where: any = dateFilter ? { createdAt: dateFilter } : {};

    const [total, byStatus, revenue] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.order.aggregate({
        where: { ...where, status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
        _sum: { totalAmount: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count._all; });

    return {
      total,
      revenue: revenue._sum.totalAmount ?? 0,
      byStatus: statusMap,
    };
  }

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [todayOrders, monthOrders, monthRevenue, pendingOrders, unansweredInquiries, lowStockProducts] =
      await Promise.all([
        this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.order.count({ where: { createdAt: { gte: monthStart, lt: nextMonth } } }),
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: monthStart, lt: nextMonth },
            status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.order.count({ where: { status: 'PENDING' } }),
        this.prisma.inquiry.count({ where: { status: 'PENDING' } }),
        this.prisma.product.findMany({
          where: { isActive: true, stock: { lte: 5 } },
          select: { id: true, name: true, stock: true },
          orderBy: { stock: 'asc' },
          take: 10,
        }),
      ]);

    return {
      todayOrders,
      monthOrders,
      monthRevenue: monthRevenue._sum.totalAmount ?? 0,
      pendingOrders,
      unansweredInquiries,
      lowStockProducts,
    };
  }
}
