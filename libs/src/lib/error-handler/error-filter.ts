import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AppError } from './app-error';

/**
 * Error response interface for consistent typing
 */
interface ErrorResponse {
  status: string;
  statusCode?: number;
  message: string;
  errorId: string;
  timestamp: string;
  path: string;
  details?: unknown;
  stack?: string;
  isOperational?: boolean;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction: boolean;

  constructor(
    @Optional() @Inject(ConfigService) private configService?: ConfigService
  ) {
    // Safely check for production environment, with fallback
    this.isProduction =
      this.configService?.get<string>('NODE_ENV') === 'production' ||
      process.env['NODE_ENV'] === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate a unique error ID for tracking
    const errorId = this.generateErrorId();

    // Default error response structure
    const errorResponse: ErrorResponse = {
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
      // If it's our custom AppError
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as Record<
        string,
        unknown
      >;

      response.status(status).json({
        ...errorResponse,
        statusCode: status,
        message: (exceptionResponse['message'] as string) || exception.message,
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
            : ((exceptionResponse as Record<string, unknown>)[
                'message'
              ] as string) || exception.message,
        details:
          typeof exceptionResponse === 'object' && exceptionResponse !== null
            ? (exceptionResponse as Record<string, unknown>)
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
      } // Special case for validation errors
      if (
        exception.name === 'ValidationError' ||
        this.hasErrorsProperty(exception)
      ) {
        response.status(HttpStatus.BAD_REQUEST).json({
          ...errorResponse,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation Error',
          details: this.hasErrorsProperty(exception)
            ? exception.errors
            : exception,
        });
        return;
      }

      // Other errors
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ...errorResponse,
        message: this.isProduction
          ? 'Internal server error'
          : exception.message,
        stack: this.isProduction ? undefined : exception.stack,
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
   * Type guard to check if an object has an 'errors' property
   */
  private hasErrorsProperty(obj: unknown): obj is { errors: unknown } {
    return obj !== null && typeof obj === 'object' && 'errors' in obj;
  }

  /**
   * Generate a unique error ID for tracking purposes using UUID
   * More reliable than Math.random() for tracking and debugging
   */
  private generateErrorId(): string {
    return randomUUID().split('-')[0];
  }
}
