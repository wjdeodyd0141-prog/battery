import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { B2bInquiriesService, CreateB2bInquiryDto } from './b2b-inquiries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('b2b-inquiries')
export class B2bInquiriesController {
  constructor(private b2bInquiriesService: B2bInquiriesService) {}

  @Post()
  create(@Body() body: CreateB2bInquiryDto) {
    return this.b2bInquiriesService.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.b2bInquiriesService.findAll();
  }
}
