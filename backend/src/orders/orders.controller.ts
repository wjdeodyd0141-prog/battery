import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateOrderDto, OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  getMyOrders(@Request() req) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('all')
  getAllOrders(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.getAllOrders({
      status,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('stats')
  getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/:id')
  getAdminOrder(@Param('id') id: string) {
    return this.ordersService.getAdminOrder(id);
  }

  // 정적 경로는 반드시 :id 라우트보다 먼저 위치해야 함
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('return-requests')
  getReturnRequests() {
    return this.ordersService.getReturnRequests();
  }

  @Get(':id')
  getOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrder(id, req.user.id);
  }

  @Patch(':id/cancel')
  cancelOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.cancelOrderByUser(id, req.user.id);
  }

  @Post(':id/return-request')
  requestReturn(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { returnType: 'RETURN' | 'EXCHANGE'; returnReason: string },
  ) {
    return this.ordersService.requestReturn(id, req.user.id, body.returnType, body.returnReason);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/approve-return')
  approveReturn(@Param('id') id: string) {
    return this.ordersService.adminApproveReturn(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/reject-return')
  rejectReturn(@Param('id') id: string, @Body() body: { rejectReason: string }) {
    return this.ordersService.adminRejectReturn(id, body.rejectReason);
  }

  @Post(':id/complete-free')
  completeFreeOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.completeFreeOrder(id, req.user.id);
  }

  @Delete(':id/pending')
  deletePendingOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.deletePendingOrder(id, req.user.id);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post()
  createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/refund')
  refundOrder(
    @Param('id') id: string,
    @Body() body: { cancelReason: string; cancelAmount?: number },
  ) {
    return this.ordersService.refundOrder(id, body.cancelReason, body.cancelAmount);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/tracking')
  updateTracking(@Param('id') id: string, @Body() body: { trackingNumber: string; carrier: string }) {
    return this.ordersService.updateTracking(id, body.trackingNumber, body.carrier);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/memo')
  updateMemo(@Param('id') id: string, @Body() body: { adminMemo: string }) {
    return this.ordersService.updateMemo(id, body.adminMemo);
  }
}
