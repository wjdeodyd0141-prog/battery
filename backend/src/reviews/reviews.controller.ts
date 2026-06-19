import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ReviewsService, CreateReviewDto } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  findByProduct(@Query('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyReviews(@Request() req) {
    return this.reviewsService.findByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.reviewsService.remove(id, req.user.id, isAdmin);
  }
}
