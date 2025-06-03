# BullMQ Configuration Module for NestJS

This module provides a centralized way to configure and manage BullMQ queues in a NestJS microservice architecture.

## Features

- Centralized queue configuration and management
- Enhanced error handling and monitoring
- Support for Redis clustering and TLS
- Queue health monitoring and metrics
- Proper connection cleanup on application shutdown
- Environment-based configuration with validation
- Bull Board integration for queue monitoring

## Installation

```bash
# Install required dependencies if not already installed
npm install @nestjs/bullmq bullmq @nestjs/config joi
```

## Usage

### Basic Usage

```typescript
// In your app.module.ts
import { Module } from '@nestjs/common';
import { BullmqConfigModule } from '@your-org/shared-packages';

@Module({
  imports: [
    BullmqConfigModule.forRoot({
      configOptions: {
        isGlobal: true,
        envFilePath: '.env',
      },
      validateSchema: true,
    }),
    BullmqConfigModule.forQueues(['email-notification', 'email-otp']),
  ],
})
export class AppModule {}
```

### Consuming Jobs

```typescript
// In your email.processor.ts
import { Processor, Process } from '@nestjs/bullmq';
import { OtpEmailJobData } from '@your-org/shared-packages';

@Processor('email-otp')
export class EmailOtpProcessor {
  @Process('send-otp')
  async handleSendOtp(job: Job<OtpEmailJobData>) {
    const { email, otpCode, otpType } = job.data;
    // Process the job...
  }
}
```

### Adding Jobs to Queues

```typescript
// In your email.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OtpEmailJobData, JOB_TYPES, JOB_PRIORITY } from '@your-org/shared-packages';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email-otp') private emailOtpQueue: Queue) {}

  async sendOtp(data: OtpEmailJobData) {
    await this.emailOtpQueue.add(JOB_TYPES.EMAIL_OTP.SEND_OTP, data, {
      priority: JOB_PRIORITY.HIGH,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
```

### Health Checking

```typescript
// In your health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { BullmqConfigService } from '@your-org/shared-packages';

@Controller('health')
export class HealthController {
  constructor(private bullmqConfigService: BullmqConfigService) {}

  @Get('queues')
  async getQueuesHealth() {
    return this.bullmqConfigService.getAllQueuesHealth();
  }
}
```

## Configuration

The module can be configured through environment variables:

```env
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_CLUSTER=false
REDIS_TLS_ENABLED=false

# Queue settings
QUEUE_PREFIX=bull
ENABLE_QUEUE_MONITORING=true

# Job settings
QUEUE_JOB_RETENTION_COMPLETED_HOURS=24
QUEUE_JOB_RETENTION_FAILED_DAYS=7
QUEUE_JOB_DEFAULT_ATTEMPTS=3
```
