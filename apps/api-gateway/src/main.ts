import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from 'packages/error-handler';
import { setupAggregatedSwagger } from 'packages/swagger-config';

import { AppModule } from './app/app.module';
import { servicesConfig } from './app/config/services.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
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

  app.useBodyParser('json', { limit: '100mb' }); // Increase JSON payload size
  app.useBodyParser('urlencoded', { extended: true, limit: '100mb' }); // Increase URL-encoded payload size

  // Set up global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.use(cookieParser());

  app.set('trust proxy', 1);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Set up aggregated Swagger documentation
  // Map service config to Swagger config format
  const swaggerServices = servicesConfig.map((service) => ({
    name: service.path,
    url: service.targetUrl,
    docsPath: 'api/docs',
  }));

  // Only setup aggregated docs in production, for development we can wait to ensure
  // all services are running before aggregation
  if (process.env.NODE_ENV === 'production') {
    try {
      await setupAggregatedSwagger(app, swaggerServices);
    } catch (error) {
      console.error(
        'Error setting up aggregated Swagger documentation:',
        error.message
      );
    }
  }

  const port = process.env.PORT || 8080;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
