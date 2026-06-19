import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  addItem(@Request() req, @Body() body: { productId: string; quantity: number; selectedOptions?: any[] }) {
    return this.cartService.addItem(req.user.id, body.productId, body.quantity, body.selectedOptions);
  }

  @Patch('items/:id')
  updateItem(@Request() req, @Param('id') id: string, @Body() body: { quantity: number }) {
    return this.cartService.updateItem(req.user.id, id, body.quantity);
  }

  @Delete('items/:id')
  removeItem(@Request() req, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.id, id);
  }
}
