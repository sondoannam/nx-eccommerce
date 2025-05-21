/**
 * Error handling package for the multi-vendor SaaS NestJS application
 *
 * Provides standardized error classes, filters, and utilities for consistent
 * error handling across all NestJS services.
 */

// Export base AppError class
export { AppError } from './app-error';

// Export all error types
export {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  AuthError,
  ConflictError,
  TimeoutError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  BadGatewayError,
} from './error-types';

// Export filters and middleware
export { AllExceptionsFilter } from './error-filter';
export { ErrorLoggerMiddleware } from './nestjs-middleware';

// Export utilities
export {
  createErrorResponse,
  isDuplicateKeyError,
  isValidationError,
  formatDuplicateKeyError,
  handleError,

  // Also export utility interfaces
  ErrorResponse,
  MongoError,
  ValidationErrorData,
} from './error-utils';
