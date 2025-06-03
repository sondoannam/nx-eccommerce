import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base application error class that extends NestJS HttpException
 * Used as the foundation for all custom errors in the application
 */
export class AppError extends HttpException {
  isOperational: boolean;
  details: Record<string, unknown>;

  /**
   * Creates a new AppError instance
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param isOperational - Whether the error is operational (expected) or programming (unexpected)
   * @param details - Additional error details (optional)
   */
  constructor(
    message: string,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    isOperational = true,
    details: Record<string, unknown> = {}
  ) {
    // Create response object following NestJS pattern
    const response = {
      statusCode,
      message,
      error: message,
      details,
      isOperational,
      timestamp: new Date().toISOString(),
    };

    super(response, statusCode);

    this.isOperational = isOperational;
    this.details = details;

    // Set the prototype explicitly - required for extending built-ins
    Object.setPrototypeOf(this, AppError.prototype);

    // Set name to the class name
    this.name = this.constructor.name;
  }
}
