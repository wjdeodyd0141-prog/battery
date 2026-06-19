import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadModule } from './upload/upload.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { BannersModule } from './banners/banners.module';
import { ProductOptionsModule } from './product-options/product-options.module';
import { PopupsModule } from './popups/popups.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 전역 Rate Limit: 1분에 최대 60회 요청
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    UploadModule,
    InquiriesModule,
    BannersModule,
    ProductOptionsModule,
    PopupsModule,
  ],
  providers: [
    // 모든 라우트에 Rate Limit 적용
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
