import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppError } from './app-error';

/**
 * Centralized exception filter for NestJS applications
 *
 * This filter handles all exceptions thrown within the application
 * and returns a consistent error response format.
 *
 * @example
 * // In your NestJS main.ts file:
 * import { AllExceptionsFilter } from '@your-org/error-handler';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   app.useGlobalFilters(new AllExceptionsFilter());
 *   await app.listen(3000);
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate a unique error ID for tracking
    const errorId = this.generateErrorId();

    // Default error response structure
    const errorResponse = {
      status: 'error',
      message: 'Internal server error',
      errorId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the error with its ID for easier tracking
    this.logger.error(`[ERROR ${errorId}]`, exception);

    // Handle different types of exceptions
    if (exception instanceof AppError) {
      // If it's our custom AppError (which extends HttpException)
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as Record<string, any>;

      response.status(status).json({
        ...errorResponse,
        statusCode: status,
        message: exceptionResponse.message || exception.message,
        details: exception.details,
        isOperational: exception.isOperational,
      });
    } else if (exception instanceof HttpException) {
      // Handle standard NestJS HttpException
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      response.status(status).json({
        ...errorResponse,
        statusCode: status,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as Record<string, any>).message ||
              exception.message,
        details:
          typeof exceptionResponse === 'object' && exceptionResponse !== null
            ? (exceptionResponse as Record<string, any>)
            : {},
      });
    } else if (exception instanceof Error) {
      // Handle other standard JS errors

      // Special case for JWT errors
      if (exception.name === 'JsonWebTokenError') {
        response.status(HttpStatus.UNAUTHORIZED).json({
          ...errorResponse,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token. Please log in again.',
        });
        return;
      }

      // Special case for validation errors
      if (exception.name === 'ValidationError' || (exception as any).errors) {
        response.status(HttpStatus.BAD_REQUEST).json({
          ...errorResponse,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation Error',
          details: (exception as any).errors || exception,
        });
        return;
      }

      // Other errors
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ...errorResponse,
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : exception.message,
        stack:
          process.env.NODE_ENV === 'production' ? undefined : exception.stack,
      });
    } else {
      // Handle unknown/unexpected errors
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ...errorResponse,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Generate a unique error ID for tracking purposes
   */
  private generateErrorId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
