import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';

// VULN-08: 허용된 업로드 폴더 목록
const ALLOWED_FOLDERS = new Set(['products', 'products/detail', 'reviews', 'banners', 'categories', 'popups']);

// VULN-07: 매직 바이트로 실제 이미지 타입 검증
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  const jpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const png  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const gif  = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  const webp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
            && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  switch (mimeType) {
    case 'image/jpeg': case 'image/jpg': return jpeg;
    case 'image/png':  return png;
    case 'image/gif':  return gif;
    case 'image/webp': return webp;
    default: return false;
  }
}

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION') as string,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') as string,
      },
    });
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME') as string;
  }

  private readonly ALLOWED_CONTENT_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  ];

  // VULN-08: 폴더 유효성 검증
  private validateFolder(folder: string): string {
    const safe = folder || 'products';
    if (!ALLOWED_FOLDERS.has(safe)) throw new BadRequestException('허용되지 않는 업로드 경로입니다.');
    return safe;
  }

  async getPresignedUrl(folder: string, contentType: string) {
    const safeFolder = this.validateFolder(folder); // VULN-08
    if (!this.ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw new BadRequestException(`허용되지 않는 파일 형식입니다. (허용: jpg, png, webp, gif)`);
    }
    const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
    const key = `${safeFolder}/${uuidv4()}.${ext}`;

    // VULN-05: ContentType을 서명에 포함시켜 다른 타입으로 업로드 차단
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    return {
      uploadUrl: url,
      key,
      publicUrl: `https://${this.bucket}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`,
    };
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<{ publicUrl: string; key: string }> {
    const safeFolder = this.validateFolder(folder); // VULN-08
    if (!this.ALLOWED_CONTENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('허용되지 않는 파일 형식입니다.');
    }
    // VULN-07: 매직 바이트 검증 (클라이언트 Content-Type 위조 방어)
    if (!validateMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException('파일 내용이 선언된 형식과 일치하지 않습니다.');
    }
    const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const key = `${safeFolder}/${uuidv4()}.${ext}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    return {
      key,
      publicUrl: `https://${this.bucket}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`,
    };
  }

  async deleteFile(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
