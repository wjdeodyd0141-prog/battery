import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
    }
    return cart;
  }

  async getCart(userId: string) {
    return this.getOrCreateCart(userId);
  }

  private computeOptionKey(selectedOptions: SelectedOption[]): string {
    if (!selectedOptions || selectedOptions.length === 0) return '';
    return [...selectedOptions]
      .sort((a, b) => a.groupId.localeCompare(b.groupId))
      .map(o => `${o.groupId}:${o.optionId}`)
      .join('|');
  }

  async addItem(userId: string, productId: string, quantity: number, selectedOptions?: SelectedOption[]) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    const optionPrice = (selectedOptions ?? []).reduce((sum, o) => sum + o.price, 0);
    const optionKey = this.computeOptionKey(selectedOptions ?? []);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId_optionKey: { cartId: cart.id, productId, optionKey } },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          optionPrice,
          selectedOptions: (selectedOptions ?? []) as any,
        },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        optionPrice,
        optionKey,
        selectedOptions: (selectedOptions ?? []) as any,
      },
      include: { product: true },
    });
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    if (quantity <= 0) return this.removeItem(userId, itemId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
    });
    if (!item) throw new ForbiddenException('접근 권한이 없습니다.');
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: string, itemId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cart: { userId } },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
}
