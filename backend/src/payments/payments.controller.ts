import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('confirm')
  confirm(
    @Body() body: { paymentKey: string; orderId: string; amount: number },
  ) {
    return this.paymentsService.confirmPayment(body.paymentKey, body.orderId, body.amount);
  }
}
