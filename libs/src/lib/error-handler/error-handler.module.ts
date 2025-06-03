import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AllExceptionsFilter } from './error-filter';
import { ErrorLoggerMiddleware } from './nestjs-middleware';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [ConfigModule],
  providers: [AllExceptionsFilter, ErrorLoggerMiddleware],
  exports: [AllExceptionsFilter, ErrorLoggerMiddleware],
})
export class ErrorHandlerModule {
  /**
   * Register the error handler module as a global module
   * This automatically applies the exception filter to all routes
   */
  static forRoot(): DynamicModule {
    return {
      module: ErrorHandlerModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: APP_FILTER,
          useClass: AllExceptionsFilter,
        },
        ErrorLoggerMiddleware,
      ],
      exports: [ErrorLoggerMiddleware],
    };
  }
}
