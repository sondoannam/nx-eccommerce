import { HttpStatus } from '@nestjs/common';
import { AppError } from './app-error';

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(
    message = 'Resource not found',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.NOT_FOUND, true, details);
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.BAD_REQUEST, true, details);
  }
}

/**
 * Error thrown when access to a resource is forbidden
 */
export class ForbiddenError extends AppError {
  constructor(
    message = 'Access forbidden',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.FORBIDDEN, true, details);
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthError extends AppError {
  constructor(
    message = 'Authentication failed',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.UNAUTHORIZED, true, details);
  }
}

/**
 * Error thrown when a conflict occurs (e.g. duplicate resource)
 */
export class ConflictError extends AppError {
  constructor(
    message = 'Conflict occurred',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.CONFLICT, true, details);
  }
}

/**
 * Error thrown when a request times out
 */
export class TimeoutError extends AppError {
  constructor(
    message = 'Request timeout',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.REQUEST_TIMEOUT, true, details);
  }
}

/**
 * Error thrown when too many requests are made
 */
export class RateLimitError extends AppError {
  constructor(
    message = 'Rate limit exceeded',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, true, details);
  }
}

/**
 * Error thrown when the server encounters an unexpected condition
 */
export class InternalServerError extends AppError {
  constructor(
    message = 'Internal server error',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, false, details);
  }
}

/**
 * Error thrown when a service is unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    message = 'Service unavailable',
    details: Record<string, unknown> = {}
  ) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, true, details);
  }
}

/**
 * Error thrown for bad gateway errors (often in microservices)
 */
export class BadGatewayError extends AppError {
  constructor(message = 'Bad gateway', details: Record<string, unknown> = {}) {
    super(message, HttpStatus.BAD_GATEWAY, true, details);
  }
}
