/**
 * Email service for multi-vendor SaaS platform
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from 'packages/error-handler';
import {
  setupSwagger,
  createServiceSwaggerOptions,
} from 'packages/swagger-config';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, BullmqConfigService } from 'packages/libs/bullmq-config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['health', 'admin'], // Exclude health and admin endpoints from global prefix
  });

  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useBodyParser('json', { limit: '1mb' }); // Increase JSON payload size
  app.useBodyParser('urlencoded', { extended: true, limit: '1mb' }); // Increase URL-encoded payload size

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
  const bullmqConfigService = app.get(BullmqConfigService);
  const queues = [
    new Queue(QUEUE_NAMES.EMAIL_OTP, {
      connection: bullmqConfigService.getRedisConfig(),
    }),
    new Queue(QUEUE_NAMES.EMAIL_NOTIFICATION, {
      connection: bullmqConfigService.getRedisConfig(),
    }),
  ];

  const { ExpressAdapter } = await import('@bull-board/express');
  const { createBullBoard } = await import('@bull-board/api');
  const { BullMQAdapter } = await import('@bull-board/api/bullMQAdapter');

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: queues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  // Set up Swagger documentation using shared configuration
  setupSwagger(app, createServiceSwaggerOptions('Email Service'));

  const port = configService.get<number>('PORT', 8002);

  await app.listen(port);

  Logger.log(
    `🚀 Email Service is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📊 Queue Dashboard available at: http://localhost:${port}/admin/queues`
  );
}

bootstrap();
