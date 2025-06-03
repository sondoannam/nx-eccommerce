# Error Handler Module for NestJS

A comprehensive error handling solution for NestJS applications, providing consistent error responses, logging, and monitoring.

## Features

- Centralized exception handling with consistent response format
- Detailed error logging with unique error IDs for tracking
- TypeScript-friendly error handling with proper typing
- Environment-aware error responses (detailed in dev, sanitized in prod)
- Built-in handling for common error types (HTTP, validation, JWT)
- Middleware for request logging and error tracking

## Installation

```bash
# Install required dependencies if not already installed
npm install @nestjs/config
```

## Usage

### Global Error Handling

For automatic global error handling, use the `forRoot()` method:

```typescript
// In your app.module.ts
import { Module } from '@nestjs/common';
import { ErrorHandlerModule } from '@your-org/shared-packages';

@Module({
  imports: [
    ErrorHandlerModule.forRoot(), // Automatically applies the filter globally
  ],
})
export class AppModule {}
```

### Manual Error Handling

If you prefer more control, you can register the filter manually:

```typescript
// In your main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@your-org/shared-packages';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(3000);
}
bootstrap();
```

### Throwing Custom Application Errors

```typescript
// In your service
import { Injectable } from '@nestjs/common';
import { AppError, ErrorTypes } from '@your-org/shared-packages';

@Injectable()
export class UserService {
  findUser(id: string) {
    const user = this.userRepository.findById(id);

    if (!user) {
      throw new AppError({
        type: ErrorTypes.RESOURCE_NOT_FOUND,
        message: `User with id ${id} not found`,
        details: { userId: id },
      });
    }

    return user;
  }
}
```

### Using the Error Logger Middleware

```typescript
// In your app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ErrorHandlerModule, ErrorLoggerMiddleware } from '@your-org/shared-packages';

@Module({
  imports: [ErrorHandlerModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ErrorLoggerMiddleware).forRoutes('*');
  }
}
```

## Error Response Format

The module provides consistent error responses:

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "User with id 123 not found",
  "errorId": "7f8d9e2a",
  "timestamp": "2023-06-02T12:34:56.789Z",
  "path": "/users/123",
  "details": {
    "userId": "123"
  }
}
```

## Configuration

The module can be configured through environment variables:

```env
# Determines the verbosity of error responses
NODE_ENV=development  # or production
```
