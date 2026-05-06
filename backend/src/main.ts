import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Same-origin deployment (Render) doesn't need CORS.
  // Keep local dev working for `ng serve` on :4200.
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({
      origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  }

  await app.init();

  // SPA fallback: let API routes win, then serve Angular's index.html.
  const server = app.getHttpAdapter().getInstance();
  server.get(/^\/(?!auth(?:\/|$)|vocabulary(?:\/|$)).*/, (_req: Request, res: Response) => {
    return res.sendFile(join(process.cwd(), 'backend', 'public', 'index.html'));
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
