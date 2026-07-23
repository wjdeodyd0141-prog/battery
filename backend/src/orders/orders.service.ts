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
}

export interface OrderQueryDto {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
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

    // VULN-01: shippingFee도 서버에서 계산 (클라이언트 값 무시)
    const shippingFee = itemsTotal >= 30000 ? 0 : 3000;
    const totalAmount = itemsTotal + shippingFee;

    // 마일리지 검증 (음수 방지 + 주문금액 초과 방지)
    const mileageUsed = Math.floor(dto.mileageUsed ?? 0);
    if (mileageUsed < 0) throw new BadRequestException('마일리지 사용 금액은 0 이상이어야 합니다.');
    if (mileageUsed > totalAmount) throw new BadRequestException('마일리지 사용 금액이 주문 금액을 초과합니다.');

    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        mileageUsed,
        shippingAddress: dto.shippingAddress,
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    // 마일리지 차감 (주문 생성 후)
    if (mileageUsed > 0) {
      await this.mileageService.spendMileage(userId, mileageUsed, order.id);
    }

    return order;
  }

  async confirmPayment(orderId: string, paymentKey: string, amount: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    const expectedAmount = order.totalAmount - (order.mileageUsed ?? 0);
    if (expectedAmount !== amount) throw new BadRequestException('결제 금액이 일치하지 않습니다.');

    // 결제 확인 + 재고 차감을 트랜잭션으로 처리
    return this.prisma.$transaction(async (tx) => {
      // 재고 차감 (atomic: stock >= quantity 조건 만족할 때만 차감)
      for (const item of order.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException('재고가 부족합니다.');
        }
      }

      // 장바구니 비우기
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
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
    if (order.status !== 'PENDING') throw new BadRequestException('이미 처리된 주문입니다.');
    const paymentAmount = order.totalAmount - (order.mileageUsed ?? 0);
    if (paymentAmount !== 0) throw new BadRequestException('마일리지로 전액 결제된 주문이 아닙니다.');

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
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID', paidAt: new Date() },
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
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, name: true, email: true, phone: true } },
      },
    });
    // DELIVERED 처리 시 마일리지 자동 적립
    if (status === 'DELIVERED') {
      this.mileageService.earnFromOrder(orderId).catch(() => {});
    }
    return updated;
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

    // 재고 복원 + 상태 변경을 트랜잭션으로 처리
    const cancelled = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: { items: { include: { product: true } } },
      });
    });

    // 마일리지 환급
    if ((order as any).mileageUsed > 0) {
      await this.mileageService.refundMileage(userId, (order as any).mileageUsed, orderId);
    }

    return cancelled;
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

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
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

  async getAllOrders(query: OrderQueryDto = {}) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
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

  async getOrderStats() {
    const [total, byStatus, revenue] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.aggregate({
        where: { status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
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
}
