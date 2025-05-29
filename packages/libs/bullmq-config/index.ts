import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

export * from './bullmq.module';
export * from './bullmq.config';

/**
 * Queue names used across the application
 */
export const QUEUE_NAMES = {
  EMAIL_OTP: 'email:otp',
  EMAIL_NOTIFICATION: 'email:notification',
  NOTIFICATION: 'notification',
};

/**
 * Job types for different queues
 */
export const JOB_TYPES = {
  EMAIL_OTP: {
    SEND_OTP: 'send-otp',
    SEND_PASSWORD_RESET: 'send-password-reset',
    SEND_TWO_FACTOR: 'send-two-factor',
  },
  EMAIL_NOTIFICATION: {
    WELCOME: 'welcome-email',
    ACCOUNT_CREATED: 'account-created',
    ORDER_CONFIRMATION: 'order-confirmation',
  },
};

/**
 * Priority levels for jobs
 */
export const JOB_PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
  BULK: 5,
};

/**
 * Create a Bull Board for queue monitoring
 * @param queues Array of BullMQ queues to monitor
 * @returns Express middleware for Bull Board
 */
export function createBullBoardMiddleware(queues: Queue[] = []) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const bullBoardQueues = queues.map((queue) => new BullMQAdapter(queue));

  createBullBoard({
    queues: bullBoardQueues,
    serverAdapter,
  });

  return serverAdapter.getRouter();
}
