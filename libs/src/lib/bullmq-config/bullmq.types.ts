// Queue names constants
export const QUEUE_NAMES = {
  EMAIL_OTP: 'email-otp',
  EMAIL_NOTIFICATION: 'email-notification',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job types for each queue
export const JOB_TYPES = {
  EMAIL_OTP: {
    SEND_OTP: 'send-otp',
    SEND_PASSWORD_RESET: 'send-password-reset',
    SEND_TWO_FACTOR: 'send-two-factor',
  },
  EMAIL_NOTIFICATION: {
    WELCOME: 'welcome',
    ORDER_CONFIRMATION: 'order-confirmation',
  },
} as const;

export type JobType = {
  [K in keyof typeof JOB_TYPES]: (typeof JOB_TYPES)[K][keyof (typeof JOB_TYPES)[K]];
}[keyof typeof JOB_TYPES];

// Job data types
export interface JobData {
  email: string;
  name: string;
  [key: string]: unknown;
}

export interface OtpEmailJobData extends JobData {
  otpCode: string;
  otpType: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR_AUTH';
  language?: 'en' | 'vi';
  userId?: string;
  expiresInMinutes?: number;
}

export interface NotificationEmailJobData extends JobData {
  userType: string;
  metadata?: Record<string, unknown>;
}

export type QueueJobData = {
  [QUEUE_NAMES.EMAIL_OTP]: OtpEmailJobData;
  [QUEUE_NAMES.EMAIL_NOTIFICATION]: NotificationEmailJobData;
};

// Job priority levels
export const JOB_PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
  BULK: 5,
};
