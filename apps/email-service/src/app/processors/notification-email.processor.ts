import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_TYPES } from 'packages/libs/bullmq-config';
import * as nodemailer from 'nodemailer';

interface NotificationEmailJobData {
  email: string;
  name: string;
  userType: string;
}

/**
 * Notification Email queue processor that handles notification emails
 */
@Processor(QUEUE_NAMES.EMAIL_NOTIFICATION)
@Injectable()
export class NotificationEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationEmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    this.logger.log('Notification email transporter initialized');
  }

  async process(job: Job<NotificationEmailJobData>): Promise<any> {
    this.logger.log(
      `Processing notification email job ${job.name} with ID ${job.id}`
    );

    try {
      switch (job.name) {
        case JOB_TYPES.EMAIL_NOTIFICATION.SEND_WELCOME:
          return await this.sendWelcomeEmail(job.data);

        case JOB_TYPES.EMAIL_NOTIFICATION.SEND_MARKETING:
          return await this.sendMarketingEmail(job.data);

        case JOB_TYPES.EMAIL_NOTIFICATION.SEND_PAYMENT_RECEIPT:
          return await this.sendPaymentReceiptEmail(job.data);

        default:
          throw new Error(`Unknown notification email job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process notification email job ${job.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(
    data: NotificationEmailJobData
  ): Promise<void> {
    this.logger.log(`Sending welcome email to ${data.email}`);

    const htmlContent = this.generateWelcomeEmailTemplate(data);

    await this.sendEmail({
      to: data.email,
      subject: 'Welcome to Multi-Vendor SaaS Platform!',
      html: htmlContent,
      priority: 'normal',
    });

    this.logger.log(`Welcome email sent successfully to ${data.email}`);
  }

  /**
   * Send marketing email (placeholder)
   */
  private async sendMarketingEmail(data: any): Promise<void> {
    this.logger.log(`Sending marketing email to ${data.email}`);
    // Implementation for marketing emails
  }

  /**
   * Send payment receipt email (placeholder)
   */
  private async sendPaymentReceiptEmail(data: any): Promise<void> {
    this.logger.log(`Sending payment receipt email to ${data.email}`);
    // Implementation for payment receipt emails
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
  }): Promise<void> {
    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Multi-Vendor SaaS'}" <${
          process.env.SMTP_FROM_EMAIL || 'noreply@example.com'
        }>`,
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
   * Clean up when the processor is destroyed
   */
  async onModuleDestroy() {
    if (this.transporter) {
      this.transporter.close();
      this.logger.log('Notification email transporter closed');
    }
  }
}
