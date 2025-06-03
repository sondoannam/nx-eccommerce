/**
 * Error utilities for the multi-vendor SaaS application
 */
import { HttpStatus } from '@nestjs/common';
import { AppError } from './app-error';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: any;
  timestamp: string;
  path?: string;
}

/**
 * MongoDB duplicate key error interface
 */
export interface MongoError {
  code: number;
  keyPattern: Record<string, number>;
  keyValue: Record<string, any>;
}

/**
 * Validation error data structure
 */
export interface ValidationErrorData {
  field: string;
  message: string;
  value?: any;
}

/**
 * Create a standardized error response object
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  error: string,
  details?: any,
  path?: string
): ErrorResponse {
  return {
    statusCode,
    message,
    error,
    details,
    timestamp: new Date().toISOString(),
    path,
  };
}

/**
 * Check if an error is a MongoDB duplicate key error
 */
export function isDuplicateKeyError(error: any): error is MongoError {
  return error && error.code === 11000;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: any): boolean {
  return error && error.name === 'ValidationError';
}

/**
 * Format MongoDB duplicate key error into a readable message
 */
export function formatDuplicateKeyError(error: MongoError): string {
  if (!isDuplicateKeyError(error)) {
    return 'Unknown error';
  }

  const field = Object.keys(error.keyPattern)[0];
  const value = error.keyValue[field];

  return `${field} '${value}' already exists`;
}

/**
 * Generic error handler that converts various error types to AppError
 */
export function handleError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (isDuplicateKeyError(error)) {
    const message = formatDuplicateKeyError(error);
    return new AppError(message, HttpStatus.CONFLICT);
  }

  if (isValidationError(error)) {
    return new AppError('Validation error', HttpStatus.BAD_REQUEST, error);
  }

  // Default to internal server error for unknown errors
  return new AppError(
    error.message || 'Internal server error',
    HttpStatus.INTERNAL_SERVER_ERROR,
    error
  );
}
