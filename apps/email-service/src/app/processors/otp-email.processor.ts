import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_TYPES } from '@multi-vendor/shared';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from '../services/email-template.service';
import { OtpService } from '../services/otp.service';

interface OtpEmailJobData {
  email: string;
  name: string;
  otpCode: string;
  otpType: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR_AUTH';
  language?: 'en' | 'vi';
  userId?: string;
  expiresInMinutes?: number;
}

/**
 * OTP Email queue processor that handles all OTP email-related jobs
 */
@Processor(QUEUE_NAMES.EMAIL_OTP)
@Injectable()
export class OtpEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(OtpEmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly emailTemplateService: EmailTemplateService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService
  ) {
    super();
    this.initializeTransporter();
  }
  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true', // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
    });

    this.logger.log('Nodemailer transporter initialized');
  }

  async process(job: Job<OtpEmailJobData>): Promise<void> {
    this.logger.log(`Processing OTP email job ${job.name} with ID ${job.id}`);

    try {
      switch (job.name) {
        case JOB_TYPES.EMAIL_OTP.SEND_OTP:
          return await this.sendVerificationOtpEmail(job.data);

        case JOB_TYPES.EMAIL_OTP.SEND_PASSWORD_RESET:
          return await this.sendPasswordResetOtpEmail(job.data);

        case JOB_TYPES.EMAIL_OTP.SEND_TWO_FACTOR:
          return await this.sendTwoFactorOtpEmail(job.data);

        default:
          throw new Error(`Unknown OTP email job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process OTP email job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Send email verification OTP
   */
  private async sendVerificationOtpEmail(data: OtpEmailJobData): Promise<void> {
    this.logger.log(`Sending email verification OTP to ${data.email}`);

    const subject = this.getSubjectByType(data.otpType, data.language || 'en');
    const htmlContent = await this.emailTemplateService.generateOtpEmail({
      recipientName: data.name,
      otpCode: data.otpCode,
      otpType: data.otpType,
      language: data.language || 'en',
      expiresInMinutes: data.expiresInMinutes || 10,
    });

    await this.sendEmail({
      to: data.email,
      subject,
      html: htmlContent,
      priority: 'high', // Email verification is high priority
    });

    this.logger.log(
      `Email verification OTP sent successfully to ${data.email}`
    );
  }

  /**
   * Send password reset OTP
   */
  private async sendPasswordResetOtpEmail(
    data: OtpEmailJobData
  ): Promise<void> {
    this.logger.log(`Sending password reset OTP to ${data.email}`);

    const subject = this.getSubjectByType(data.otpType, data.language || 'en');
    const htmlContent = await this.emailTemplateService.generateOtpEmail({
      recipientName: data.name,
      otpCode: data.otpCode,
      otpType: data.otpType,
      language: data.language || 'en',
      expiresInMinutes: data.expiresInMinutes || 15,
    });

    await this.sendEmail({
      to: data.email,
      subject,
      html: htmlContent,
      priority: 'high', // Password reset is high priority
    });

    this.logger.log(`Password reset OTP sent successfully to ${data.email}`);
  }

  /**
   * Send two-factor authentication OTP
   */
  private async sendTwoFactorOtpEmail(data: OtpEmailJobData): Promise<void> {
    this.logger.log(`Sending 2FA OTP to ${data.email}`);

    const subject = this.getSubjectByType(data.otpType, data.language || 'en');
    const htmlContent = await this.emailTemplateService.generateOtpEmail({
      recipientName: data.name,
      otpCode: data.otpCode,
      otpType: data.otpType,
      language: data.language || 'en',
      expiresInMinutes: data.expiresInMinutes || 5,
    });

    await this.sendEmail({
      to: data.email,
      subject,
      html: htmlContent,
      priority: 'high', // 2FA is high priority
    });

    this.logger.log(`2FA OTP sent successfully to ${data.email}`);
  }

  /**
   * Send email using nodemailer
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<void> {
    try {
      const mailOptions = {
        from: `"${this.configService.get<string>(
          'SMTP_FROM_NAME',
          'Multi-Vendor SaaS'
        )}" <${this.configService.get<string>(
          'SMTP_FROM_EMAIL',
          'noreply@example.com'
        )}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        priority: options.priority || 'normal',
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${result.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Get email subject based on OTP type and language
   */
  private getSubjectByType(otpType: string, language: string): string {
    const subjects = {
      en: {
        EMAIL_VERIFICATION: 'Verify Your Email Address',
        PASSWORD_RESET: 'Reset Your Password',
        TWO_FACTOR_AUTH: 'Two-Factor Authentication Code',
      },
      vi: {
        EMAIL_VERIFICATION: 'Xác minh địa chỉ email của bạn',
        PASSWORD_RESET: 'Đặt lại mật khẩu của bạn',
        TWO_FACTOR_AUTH: 'Mã xác thực hai yếu tố',
      },
    };

    return (
      subjects[language]?.[otpType] ??
      subjects.en[otpType] ??
      'OTP Verification Code'
    );
  }

  /**
   * Clean up when the processor is destroyed
   */
  async onModuleDestroy() {
    if (this.transporter) {
      this.transporter.close();
      this.logger.log('Nodemailer transporter closed');
    }
  }
}
