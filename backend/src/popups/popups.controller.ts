import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PopupsService } from './popups.service';
import type { CreatePopupDto } from './popups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('popups')
export class PopupsController {
  constructor(private popupsService: PopupsService) {}

  @Get()
  getActivePopups() {
    return this.popupsService.getActivePopups();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('all')
  getAllPopups() {
    return this.popupsService.getAllPopups();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreatePopupDto) {
    return this.popupsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePopupDto>) {
    return this.popupsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.popupsService.remove(id);
  }
}
