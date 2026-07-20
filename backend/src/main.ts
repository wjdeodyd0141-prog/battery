import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // VULN-10: Railway 리버스 프록시 뒤에서 실제 클라이언트 IP 추출
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // HTTP 보안 헤더 (클릭재킹·XSS·MIME 스니핑 방지)
  app.use((helmet as any).default());

  // VULN-13: Origin 없는 요청은 내부 도구·헬스체크용으로만 허용 (실 공격 위험 낮음)
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URL_2,
      ].filter(Boolean) as string[];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}/api`);
}
bootstrap();
