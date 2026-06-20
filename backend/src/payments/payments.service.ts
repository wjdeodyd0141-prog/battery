import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  private readonly tossSecretKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {
    this.tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY') as string;
  }

  async confirmPayment(userId: string, paymentKey: string, orderId: string, amount: number) {
    if (!this.tossSecretKey) throw new BadRequestException('결제 키가 설정되지 않았습니다. 관리자에게 문의하세요.');

    const existingOrder = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (existingOrder.userId !== userId) throw new ForbiddenException('권한이 없습니다.');
    const encodedKey = Buffer.from(`${this.tossSecretKey}:`).toString('base64');

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      // 이미 처리된 결제인 경우 DB에서 주문 조회 후 성공으로 반환
      if (error.code === 'ALREADY_PROCESSED_PAYMENT') {
        const order = await this.ordersService.getOrderByIdDirect(orderId);
        if (order && order.status === 'PAID') {
          return { order, tossData: null };
        }
      }
      throw new BadRequestException(error.message || '결제 승인에 실패했습니다.');
    }

    const tossData = await response.json();
    const order = await this.ordersService.confirmPayment(orderId, paymentKey, amount);

    return { order, tossData };
  }
}
