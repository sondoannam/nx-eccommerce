import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_NAMES,
  JOB_TYPES,
  JOB_PRIORITY,
  PrismaBaseService,
} from '@multi-vendor/shared';
import {
  SendOtpDto,
  OtpResponseDto,
  OtpType,
  Language,
  VerifyOtpVerificationDto,
  VerifyOtpResultDto,
} from '../dtos';
import { OtpVerificationService } from './otp-verification.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL_OTP) private readonly otpQueue: Queue,
    private readonly prisma: PrismaBaseService,
    private readonly otpVerificationService: OtpVerificationService
  ) {}
  /**
   * Generate a 6-digit OTP code
   */
  public generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get job priority based on OTP type
   */
  private getJobPriority(otpType: OtpType): number {
    switch (otpType) {
      case OtpType.PASSWORD_RESET:
      case OtpType.TWO_FACTOR_AUTH:
        return JOB_PRIORITY.CRITICAL;
      case OtpType.EMAIL_VERIFICATION:
        return JOB_PRIORITY.HIGH;
      case OtpType.PHONE_VERIFICATION:
        return JOB_PRIORITY.NORMAL;
      default:
        return JOB_PRIORITY.NORMAL;
    }
  }

  /**
   * Get appropriate job type based on OTP type
   */
  private getJobType(otpType: OtpType): string {
    switch (otpType) {
      case OtpType.EMAIL_VERIFICATION:
        return JOB_TYPES.EMAIL_OTP.SEND_OTP;
      case OtpType.PASSWORD_RESET:
        return JOB_TYPES.EMAIL_OTP.SEND_PASSWORD_RESET;
      case OtpType.TWO_FACTOR_AUTH:
        return JOB_TYPES.EMAIL_OTP.SEND_TWO_FACTOR;
      default:
        return JOB_TYPES.EMAIL_OTP.SEND_OTP;
    }
  }

  /**
   * Send OTP email by queuing the job and storing in database
   */
  async sendOtp(sendOtpDto: SendOtpDto): Promise<OtpResponseDto> {
    const { email, name, otpType, userId, language = Language.EN } = sendOtpDto;

    // Generate OTP code
    const otpCode = this.generateOtpCode();

    try {
      // Store OTP in database
      const otpVerification =
        await this.otpVerificationService.createOtpVerification({
          userId,
          otpCode,
          otpType,
          expiryMinutes: this.OTP_EXPIRY_MINUTES,
          metadata: {
            email,
            name,
            language,
            sentAt: new Date().toISOString(),
          },
        });

      // Prepare job data
      const jobData = {
        email,
        name,
        otpCode,
        otpType,
        userId,
        language,
        expiresAt: otpVerification.expiresAt.toISOString(),
        verificationId: otpVerification.id,
      };

      // Queue the OTP email job
      const job = await this.otpQueue.add(this.getJobType(otpType), jobData, {
        priority: this.getJobPriority(otpType),
        delay: 0, // Send immediately
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 50,
      });

      this.logger.log(
        `Queued ${otpType} OTP email job ${job.id} for user ${userId} (${email})`
      );

      return {
        jobId: job.id || 'unknown',
        message: 'OTP has been sent successfully',
        expiresInMinutes: this.OTP_EXPIRY_MINUTES,
      };
    } catch (error) {
      this.logger.error(`Failed to queue OTP email for ${email}:`, error);
      throw error;
    }
  }
  /**
   * Verify an OTP code
   */
  async verifyOtp(data: VerifyOtpVerificationDto): Promise<VerifyOtpResultDto> {
    try {
      const result = await this.otpVerificationService.verifyOtp(data);
      return result;
    } catch (error) {
      this.logger.error(
        `OTP verification failed: ${error.message}`,
        error.stack
      );

      return {
        success: false,
        message: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats() {
    try {
      const waiting = await this.otpQueue.getWaiting();
      const active = await this.otpQueue.getActive();
      const completed = await this.otpQueue.getCompleted();
      const failed = await this.otpQueue.getFailed();

      return {
        queueName: QUEUE_NAMES.EMAIL_OTP,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total:
          waiting.length + active.length + completed.length + failed.length,
      };
    } catch (error) {
      this.logger.error('Failed to get queue statistics:', error);
      throw error;
    }
  }

  /**
   * Get failed jobs for debugging
   */
  async getFailedJobs(start = 0, end = 10) {
    try {
      const failedJobs = await this.otpQueue.getFailed(start, end);
      return failedJobs.map((job) => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        attemptsMade: job.attemptsMade,
      }));
    } catch (error) {
      this.logger.error('Failed to get failed jobs:', error);
      throw error;
    }
  }
}
