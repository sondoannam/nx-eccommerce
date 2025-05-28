import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedBullMQModule, QUEUE_NAMES } from 'packages/libs/bullmq-config';
import { PrismaModule } from 'packages/libs/prisma';
import { NotificationEmailProcessor } from './processors/notification-email.processor';
import { EmailTemplateService } from './services/email-template.service';
import { OtpService } from './services/otp.service';
import { OtpEmailProcessor } from './processors/otp-email.processor';
import { OtpVerificationService } from './services/otp-verification.service';

@Module({
  imports: [
    PrismaModule,
    SharedBullMQModule.forQueues([
      QUEUE_NAMES.EMAIL_OTP,
      QUEUE_NAMES.EMAIL_NOTIFICATION,
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    OtpEmailProcessor,
    NotificationEmailProcessor,
    EmailTemplateService,
    OtpService,
    OtpVerificationService,
  ],
})
export class AppModule {}
