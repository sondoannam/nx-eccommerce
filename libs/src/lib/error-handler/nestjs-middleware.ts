import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * NestJS compatible middleware for error handling
 *
 * While NestJS prefers exception filters, this middleware can be used
 * in specific situations where middleware is more appropriate.
 *
 * @example
 * // In your module:
 * import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
 * import { ErrorLoggerMiddleware } from '@your-org/error-handler';
 *
 * @Module({})
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(ErrorLoggerMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 */
@Injectable()
export class ErrorLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Capture errors that occur during request processing
    const originalSend = res.send;
    const logger = this.logger;

    res.send = function (body) {
      const statusCode = res.statusCode;

      // Log error responses (4xx, 5xx)
      if (statusCode >= 400) {
        const errorId = generateErrorId();
        const errorData =
          typeof body === 'string' ? body : JSON.stringify(body);

        logger.error(`[ERROR ${errorId}] Status ${statusCode}: ${errorData}`);
      }

      // Call the original send method
      return originalSend.call(this, body);
    };

    next();
  }
}

/**
 * Generate a unique error ID for tracking purposes
 */
const generateErrorId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
