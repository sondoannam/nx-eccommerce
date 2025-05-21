/**
 * Auth service for multi-vendor SaaS platform
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from 'packages/error-handler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['health'], // Exclude health endpoint from global prefix for compatibility
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 8001;

  await app.listen(port);

  Logger.log(
    `🚀 Auth Service is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
