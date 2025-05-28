/**
 * Email service for multi-vendor SaaS platform
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
import { Queue } from 'bullmq';
import {
  createQueueDashboard,
  QUEUE_NAMES,
  bullMQRedisConfig,
} from 'packages/libs/bullmq-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['health', 'admin'], // Exclude health and admin endpoints from global prefix
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

  // Set up Bull Board for queue monitoring
  const queues = [
    new Queue(QUEUE_NAMES.EMAIL_OTP, { connection: bullMQRedisConfig }),
    new Queue(QUEUE_NAMES.EMAIL_NOTIFICATION, {
      connection: bullMQRedisConfig,
    }),
  ];

  const serverAdapter = createQueueDashboard(queues);
  app.use('/admin/queues', serverAdapter.getRouter());

  // Set up Swagger documentation using shared configuration
  setupSwagger(app, createServiceSwaggerOptions('Email Service'));

  const port = process.env.PORT || 8002;

  await app.listen(port);

  Logger.log(
    `🚀 Email Service is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📊 Queue Dashboard available at: http://localhost:${port}/admin/queues`
  );
}

bootstrap();
