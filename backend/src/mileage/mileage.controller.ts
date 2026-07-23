import { Controller, Get, Post, Patch, Body, Query, Request, UseGuards } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class MileageController {
  constructor(private mileageService: MileageService) {}

  @UseGuards(JwtAuthGuard)
  @Get('mileage/balance')
  getBalance(@Request() req) {
    return this.mileageService.getBalance(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mileage/history')
  getHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mileageService.getHistory(req.user.id, page ? +page : 1, limit ? +limit : 20);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/mileage/settings')
  getSettings() {
    return this.mileageService.getDefaultRate().then(rate => ({ rate }));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/mileage/settings')
  setSettings(@Body() body: { rate: number }) {
    return this.mileageService.setDefaultRate(body.rate);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/mileage/grant')
  grant(@Body() body: { userId: string; amount: number; reason: string }) {
    return this.mileageService.adminGrant(body.userId, body.amount, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/mileage/users')
  getUserList(
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    return this.mileageService.getAdminUserList(search, page ? +page : 1);
  }
}
