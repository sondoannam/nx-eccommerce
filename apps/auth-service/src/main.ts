/**
 * Auth service for multi-vendor SaaS platform
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from 'packages/error-handler';
import {
  setupSwagger,
  createServiceSwaggerOptions,
} from 'packages/swagger-config';

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

  // Set up global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  // Set up Swagger documentation using shared configuration
  setupSwagger(app, createServiceSwaggerOptions('Auth Service'));

  const port = process.env.PORT || 8001;

  await app.listen(port);

  Logger.log(
    `🚀 Auth Service is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
