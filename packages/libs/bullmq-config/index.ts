import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { ConnectionOptions, Queue } from 'bullmq';

/**
 * BullMQ Redis connection configuration
 */
export const bullMQRedisConfig: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  retryDelayOnFailover: 200, // Increased to allow for cloud Redis latency
  maxRetriesPerRequest: null,
  lazyConnect: true, // Connection pool settings for better performance
  family: 4,
  keepAlive: 10000,
  connectTimeout: 30000, // Increased timeout for cloud services
  commandTimeout: 15000,
  tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
  enableReadyCheck: false,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
};

/**
 * Default queue options for BullMQ
 */
export const defaultQueueOptions = {
  connection: bullMQRedisConfig,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep only 10 completed jobs
    removeOnFail: 50, // Keep 50 failed jobs for debugging
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
  },
};

/**
 * Queue names used across the application
 */
export const QUEUE_NAMES = {
  EMAIL_OTP: 'email-otp-queue',
  SMS_OTP: 'sms-otp-queue',
  EMAIL_NOTIFICATION: 'email-notification-queue',
  ANALYTICS: 'analytics-queue',
} as const;

/**
 * Job types for different queues
 */
export const JOB_TYPES = {
  EMAIL_OTP: {
    SEND_VERIFICATION_OTP: 'send-verification-otp',
    SEND_PASSWORD_RESET_OTP: 'send-password-reset-otp',
    SEND_TWO_FACTOR_OTP: 'send-two-factor-otp',
  },
  SMS_OTP: {
    SEND_VERIFICATION_OTP: 'send-sms-verification-otp',
    SEND_PASSWORD_RESET_OTP: 'send-sms-password-reset-otp',
  },
  EMAIL_NOTIFICATION: {
    SEND_WELCOME: 'send-welcome-email',
    SEND_MARKETING: 'send-marketing-email',
    SEND_PAYMENT_RECEIPT: 'send-payment-receipt',
  },
  ANALYTICS: {
    TRACK_EVENT: 'track-event',
    GENERATE_REPORT: 'generate-report',
  },
} as const;

/**
 * Create Bull Board for monitoring queues (optional)
 * This creates a web UI to monitor your queues
 */
export function createQueueDashboard(queues: Queue[]) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const queueAdapters = queues.map((queue) => new BullMQAdapter(queue));

  createBullBoard({
    queues: queueAdapters,
    serverAdapter,
  });

  return serverAdapter;
}

/**
 * Priority levels for jobs
 */
export const JOB_PRIORITY = {
  CRITICAL: 1, // Highest priority (security-related, payments)
  HIGH: 2, // Important (password resets, OTP)
  NORMAL: 3, // Standard (welcome emails)
  LOW: 4, // Lowest priority (marketing, analytics)
} as const;

// Export the module for easy imports
export { SharedBullMQModule } from './bullmq.module';
