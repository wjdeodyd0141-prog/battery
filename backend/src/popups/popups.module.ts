import { Module } from '@nestjs/common';
import { PopupsService } from './popups.service';
import { PopupsController } from './popups.controller';

@Module({
  controllers: [PopupsController],
  providers: [PopupsService],
})
export class PopupsModule {}
