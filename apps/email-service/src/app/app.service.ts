import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_TYPES, JOB_PRIORITY } from '@multi-vendor/shared';
import { SendOtpDto, OtpResponseDto, VerifyOtpDto } from './dtos/otp.dto';
import { VerifyOtpResultDto } from './dtos/otp-verification.dto';
import { OtpService } from './services/otp.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL_OTP) private readonly otpEmailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL_NOTIFICATION)
    private readonly notificationQueue: Queue,
    private readonly otpService: OtpService
  ) {}

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const otpStats = await this.otpEmailQueue.getJobCounts();
    const notificationStats = await this.notificationQueue.getJobCounts();

    return {
      otpEmailQueue: {
        name: QUEUE_NAMES.EMAIL_OTP,
        ...otpStats,
      },
      notificationQueue: {
        name: QUEUE_NAMES.EMAIL_NOTIFICATION,
        ...notificationStats,
      },
    };
  }

  /**
   * Queue email verification OTP
   */
  async queueEmailVerificationOtp(data: SendOtpDto): Promise<OtpResponseDto> {
    const otpCode = this.otpService.generateOtpCode();

    const job = await this.otpEmailQueue.add(
      JOB_TYPES.EMAIL_OTP.SEND_OTP,
      {
        email: data.email,
        name: data.name,
        otpCode,
        otpType: 'EMAIL_VERIFICATION',
        language: data.language || 'en',
        userId: data.userId,
        expiresInMinutes: 10,
      },
      {
        priority: JOB_PRIORITY.HIGH,
        delay: 0,
        attempts: 3,
      }
    );

    this.logger.log(
      `Queued email verification OTP job ${job.id} for ${data.email}`
    );

    return {
      message: 'Email verification OTP queued successfully',
      jobId: job.id || 'unknown',
      expiresInMinutes: 10,
    };
  }

  /**
   * Queue password reset OTP
   */
  async queuePasswordResetOtp(data: SendOtpDto): Promise<OtpResponseDto> {
    const otpCode = this.otpService.generateOtpCode();

    const job = await this.otpEmailQueue.add(
      JOB_TYPES.EMAIL_OTP.SEND_PASSWORD_RESET,
      {
        email: data.email,
        name: data.name,
        otpCode,
        otpType: 'PASSWORD_RESET',
        language: data.language || 'en',
        userId: data.userId,
        expiresInMinutes: 15,
      },
      {
        priority: JOB_PRIORITY.HIGH,
        delay: 0,
        attempts: 3,
      }
    );

    this.logger.log(
      `Queued password reset OTP job ${job.id} for ${data.email}`
    );

    return {
      message: 'Password reset OTP queued successfully',
      jobId: job.id || 'unknown',
      expiresInMinutes: 15,
    };
  }

  /**
   * Queue two-factor authentication OTP
   */
  async queueTwoFactorOtp(data: SendOtpDto): Promise<OtpResponseDto> {
    const otpCode = this.otpService.generateOtpCode();

    const job = await this.otpEmailQueue.add(
      JOB_TYPES.EMAIL_OTP.SEND_TWO_FACTOR,
      {
        email: data.email,
        name: data.name,
        otpCode,
        otpType: 'TWO_FACTOR_AUTH',
        language: data.language || 'en',
        userId: data.userId,
        expiresInMinutes: 5,
      },
      {
        priority: JOB_PRIORITY.CRITICAL,
        delay: 0,
        attempts: 3,
      }
    );

    this.logger.log(`Queued two-factor OTP job ${job.id} for ${data.email}`);

    return {
      message: 'Two-factor OTP queued successfully',
      jobId: job.id || 'unknown',
      expiresInMinutes: 5,
    };
  }

  /**
   * Queue welcome email job
   */
  async queueWelcomeEmail(data: {
    email: string;
    name: string;
    userType: string;
  }): Promise<{ jobId: string }> {
    const job = await this.notificationQueue.add(
      JOB_TYPES.EMAIL_NOTIFICATION.WELCOME,
      data,
      {
        priority: JOB_PRIORITY.NORMAL,
        delay: 0,
        attempts: 2,
      }
    );

    this.logger.log(`Queued welcome email job ${job.id} for ${data.email}`);
    return { jobId: job.id || 'unknown' };
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(data: VerifyOtpDto): Promise<VerifyOtpResultDto> {
    this.logger.log(
      `Verifying OTP for user ${data.userId} with type ${data.otpType}`
    );
    return this.otpService.verifyOtp({
      userId: data.userId,
      otpCode: data.otpCode,
      otpType: data.otpType,
    });
  }
}
