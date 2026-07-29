import { Module } from '@nestjs/common';
import { B2bInquiriesController } from './b2b-inquiries.controller';
import { B2bInquiriesService } from './b2b-inquiries.service';

@Module({
  controllers: [B2bInquiriesController],
  providers: [B2bInquiriesService],
})
export class B2bInquiriesModule {}
