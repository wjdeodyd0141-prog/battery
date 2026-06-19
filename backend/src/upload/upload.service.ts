import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';

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

  async getPresignedUrl(folder: string, contentType: string) {
    if (!this.ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw new Error(`허용되지 않는 파일 형식입니다. (허용: jpg, png, webp, gif)`);
    }
    const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
    const key = `${folder}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 300 });

    return {
      uploadUrl: url,
      key,
      publicUrl: `https://${this.bucket}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`,
    };
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<{ publicUrl: string; key: string }> {
    if (!this.ALLOWED_CONTENT_TYPES.includes(file.mimetype)) {
      throw new Error('허용되지 않는 파일 형식입니다.');
    }
    const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const key = `${folder}/${uuidv4()}.${ext}`;
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
