import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
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
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map(i => i.productId) } },
    });

    let itemsTotal = 0;
    const orderItems = dto.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new NotFoundException(`상품 ${item.productId}을 찾을 수 없습니다.`);
      if (product.stock < item.quantity) throw new BadRequestException(`${product.name} 재고가 부족합니다.`);
      const optionPrice = item.optionPrice ?? 0;
      itemsTotal += (product.price + optionPrice) * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        optionPrice,
        selectedOptions: (item.selectedOptions ?? []) as any,
      };
    });

    const shippingFee = dto.shippingFee ?? (itemsTotal >= 30000 ? 0 : 3000);
    const totalAmount = itemsTotal + shippingFee;

    return this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        shippingAddress: dto.shippingAddress,
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async confirmPayment(orderId: string, paymentKey: string, amount: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (order.totalAmount !== amount) throw new BadRequestException('결제 금액이 일치하지 않습니다.');

    // 결제 확인 + 재고 차감을 트랜잭션으로 처리
    return this.prisma.$transaction(async (tx) => {
      // 재고 차감
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 장바구니 비우기
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID', paymentKey, paidAt: new Date() },
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
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, username: true, name: true, email: true, phone: true } },
      },
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

    // 재고 복원 + 상태 변경을 트랜잭션으로 처리
    return this.prisma.$transaction(async (tx) => {
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
