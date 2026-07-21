import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class CouponController {
  constructor(private couponService: CouponService) {}

  /* ─── Admin ─── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/coupons')
  createCoupon(@Body() body: any) {
    return this.couponService.createCoupon(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/coupons/users')
  getUsers(@Query('search') search?: string) {
    return this.couponService.getAdminUsers(search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/coupons')
  listCoupons() {
    return this.couponService.listCoupons();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/coupons/:id/issue')
  issueCoupon(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.couponService.issueCoupon(id, body.userId);
  }

  /* ─── User ─── */

  @UseGuards(JwtAuthGuard)
  @Get('coupons/my')
  getMyCoupons(@Request() req) {
    return this.couponService.getMyCoupons(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('coupons/unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.couponService.getUnreadCount(req.user.id);
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('coupons/mark-read')
  markAllRead(@Request() req) {
    return this.couponService.markAllRead(req.user.id);
  }
}
