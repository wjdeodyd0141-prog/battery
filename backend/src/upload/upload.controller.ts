import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const imageInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('image')
  @UseInterceptors(imageInterceptor)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
  ) {
    if (!file) throw new BadRequestException('파일이 없습니다.');
    return this.uploadService.uploadFile(file, folder || 'products');
  }

  @Post('image/review')
  @UseInterceptors(imageInterceptor)
  async uploadReviewImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('파일이 없습니다.');
    return this.uploadService.uploadFile(file, 'reviews');
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('presigned')
  getPresignedUrl(@Body() body: { folder: string; contentType: string }) {
    return this.uploadService.getPresignedUrl(body.folder, body.contentType);
  }

  @Post('presigned/review')
  getReviewPresignedUrl(@Body() body: { contentType: string }) {
    return this.uploadService.getPresignedUrl('reviews', body.contentType);
  }
}
