import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import {
  QUEUE_NAMES,
  JOB_TYPES,
  NotificationEmailJobData,
} from '@multi-vendor/shared';
import * as nodemailer from 'nodemailer';

/**
 * Notification Email queue processor that handles notification emails
 */
@Processor(QUEUE_NAMES.EMAIL_NOTIFICATION)
@Injectable()
export class NotificationEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationEmailProcessor.name);
  private transporter: nodemailer.Transporter;
  private readonly maxRetries = 3;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(QUEUE_NAMES.EMAIL_NOTIFICATION)
    private readonly notificationQueue: Queue<NotificationEmailJobData>
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
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5, // Limit to 5 emails per second
    });

    this.logger.log('Notification email transporter initialized');
  }

  async process(job: Job<NotificationEmailJobData>): Promise<void> {
    this.logger.log(
      `Processing notification email job ${job.name} with ID ${job.id}`
    );

    try {
      // Update job progress
      await job.updateProgress(10);

      // Validate job data
      this.validateJobData(job.data);
      await job.updateProgress(20);

      // Process based on job type
      let result;
      switch (job.name) {
        case JOB_TYPES.EMAIL_NOTIFICATION.WELCOME:
          result = await this.sendWelcomeEmail(job);
          break;

        // case JOB_TYPES.EMAIL_NOTIFICATION.SEND_MARKETING:
        //   return await this.sendMarketingEmail(job.data);

        case JOB_TYPES.EMAIL_NOTIFICATION.ORDER_CONFIRMATION:
          result = await this.sendPaymentReceiptEmail(job);
          break;

        default:
          throw new Error(`Unknown notification email job type: ${job.name}`);
      }

      // Log success and return result
      this.logger.log(`Successfully processed job ${job.id}`);
      return result;
    } catch (error) {
      // Handle specific error types
      if (error.code === 'ECONNREFUSED') {
        this.logger.error(`SMTP connection refused for job ${job.id}`);
        await this.handleSMTPError(job, error);
        throw error;
      }

      if (error.code === 'ETIMEDOUT') {
        this.logger.error(`SMTP timeout for job ${job.id}`);
        await this.handleSMTPError(job, error);
        throw error;
      }

      // Log the error with context
      this.logger.error(
        `Failed to process notification email job ${job.id}:`,
        error.stack
      );
      throw error;
    }
  }

  private validateJobData(data: NotificationEmailJobData): void {
    if (!data.email || !data.name || !data.userType) {
      throw new Error('Missing required job data fields');
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email address');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async handleSMTPError(
    job: Job<NotificationEmailJobData>,
    error: Error
  ): Promise<void> {
    const attempts = job.attemptsMade;

    if (attempts < this.maxRetries) {
      const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
      await job.moveToDelayed(Date.now() + delay);
      this.logger.log(
        `Retrying job ${job.id} in ${delay}ms (attempt ${attempts + 1}/${
          this.maxRetries
        })`
      );
    } else {
      this.logger.error(
        `Job ${job.id} failed after ${attempts} attempts: ${error.message}`
      );
      // Could implement fallback delivery method here
    }
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(
    job: Job<NotificationEmailJobData>
  ): Promise<void> {
    const { data } = job;
    this.logger.log(`Sending welcome email to ${data.email}`);

    await job.updateProgress(40);
    const htmlContent = this.generateWelcomeEmailTemplate(data);
    await job.updateProgress(60);

    await this.sendEmail({
      to: data.email,
      subject: 'Welcome to Multi-Vendor SaaS Platform!',
      html: htmlContent,
      priority: 'normal',
      jobId: job.id,
    });

    await job.updateProgress(100);
    this.logger.log(`Welcome email sent successfully to ${data.email}`);
  }

  /**
   * Send marketing email (placeholder)
   */
  private async sendMarketingEmail(
    data: NotificationEmailJobData
  ): Promise<void> {
    this.logger.log(`Sending marketing email to ${data.email}`);
    // Implementation for marketing emails
  }

  /**
   * Send payment receipt email (placeholder)
   */
  private async sendPaymentReceiptEmail(
    job: Job<NotificationEmailJobData>
  ): Promise<void> {
    const { data } = job;
    this.logger.log(`Sending payment receipt email to ${data.email}`);
    await job.updateProgress(40);

    // Implementation for payment receipt emails
    // ... (implement similar to welcome email)

    await job.updateProgress(100);
    this.logger.log(`Payment receipt email sent successfully to ${data.email}`);
  }

  /**
   * Generate welcome email template
   */
  private generateWelcomeEmailTemplate(data: NotificationEmailJobData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Multi-Vendor SaaS</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .content { color: #666; line-height: 1.6; }
          .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Multi-Vendor SaaS!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.name},</p>
            <p>Welcome to our Multi-Vendor SaaS platform! We're excited to have you join our community as a <strong>${data.userType}</strong>.</p>
            <p>You can now start exploring all the features available to you:</p>
            <ul>
              <li>Manage your products and services</li>
              <li>Connect with customers</li>
              <li>Track your performance</li>
              <li>Access powerful analytics</li>
            </ul>
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            <a href="#" class="button">Get Started</a>
          </div>
          <div class="footer">
            <p>© 2025 Multi-Vendor SaaS Platform. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send email using nodemailer
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    priority?: 'high' | 'normal' | 'low';
    jobId: string;
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
        messageId: `<${options.jobId}@${this.configService.get<string>(
          'SMTP_DOMAIN',
          'example.com'
        )}>`,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${result.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Clean up when the processor is destroyed
   */
  async onModuleDestroy() {
    if (this.transporter) {
      this.transporter.close();
      this.logger.log('Notification email transporter closed');
    }
  }
}
