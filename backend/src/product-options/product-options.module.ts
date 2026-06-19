import { Module } from '@nestjs/common';
import { ProductOptionsController } from './product-options.controller';
import { ProductOptionsService } from './product-options.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductOptionsController],
  providers: [ProductOptionsService],
})
export class ProductOptionsModule {}
