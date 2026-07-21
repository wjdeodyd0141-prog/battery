import { Module } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { MileageController } from './mileage.controller';

@Module({
  controllers: [MileageController],
  providers: [MileageService],
  exports: [MileageService],
})
export class MileageModule {}
