import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProductOptionsService } from './product-options.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products/:productId/option-groups')
export class ProductOptionsController {
  constructor(private service: ProductOptionsService) {}

  @Get()
  getGroups(@Param('productId') productId: string) {
    return this.service.getGroups(productId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  createGroup(@Param('productId') productId: string, @Body() body: any) {
    return this.service.createGroup(productId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('groups/:groupId')
  updateGroup(@Param('groupId') groupId: string, @Body() body: any) {
    return this.service.updateGroup(groupId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('groups/:groupId')
  deleteGroup(@Param('groupId') groupId: string) {
    return this.service.deleteGroup(groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('groups/:groupId/options')
  createOption(@Param('groupId') groupId: string, @Body() body: any) {
    return this.service.createOption(groupId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('groups/:groupId/options/:optionId')
  updateOption(@Param('optionId') optionId: string, @Body() body: any) {
    return this.service.updateOption(optionId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('groups/:groupId/options/:optionId')
  deleteOption(@Param('optionId') optionId: string) {
    return this.service.deleteOption(optionId);
  }
}
