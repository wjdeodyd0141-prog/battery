import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { ReplyInquiryDto } from './dto/reply-inquiry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inquiries')
export class InquiriesController {
  constructor(private inquiriesService: InquiriesService) {}

  // 비로그인 접근 가능 — 비밀글 제외한 공개 목록
  @Get('public')
  findPublic() {
    return this.inquiriesService.findPublic();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.inquiriesService.findAll(req.user.id, req.user.role === 'ADMIN');
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.inquiriesService.findOne(id, req.user.id, req.user.role === 'ADMIN');
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateInquiryDto) {
    return this.inquiriesService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.inquiriesService.remove(id, req.user.id, req.user.role === 'ADMIN');
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reply')
  reply(@Param('id') id: string, @Request() req, @Body() dto: ReplyInquiryDto) {
    if (req.user.role !== 'ADMIN') throw new Error('관리자만 답변할 수 있습니다.');
    return this.inquiriesService.reply(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/reply')
  deleteReply(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'ADMIN') throw new Error('관리자만 삭제할 수 있습니다.');
    return this.inquiriesService.deleteReply(id);
  }
}
