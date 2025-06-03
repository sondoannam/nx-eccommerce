import * as Joi from 'joi';

/**
 * Schema for validating BullMQ and Redis configuration
 */
export const bullmqConfigSchema = Joi.object({
  // Redis connection
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_USERNAME: Joi.string().allow('').optional(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_CLUSTER: Joi.boolean().default(false),
  REDIS_MAX_CONNECTIONS: Joi.number().default(50),
  REDIS_TLS_ENABLED: Joi.boolean().default(false),
  REDIS_SENTINELS: Joi.string().allow('').optional(),

  // Queue specific configuration
  QUEUE_PREFIX: Joi.string().default('bull'),
  ENABLE_QUEUE_MONITORING: Joi.boolean().default(false),

  // Queue job options
  QUEUE_JOB_RETENTION_COMPLETED_HOURS: Joi.number().default(24),
  QUEUE_JOB_RETENTION_COMPLETED_COUNT: Joi.number().default(1000),
  QUEUE_JOB_RETENTION_FAILED_DAYS: Joi.number().default(7),
  QUEUE_JOB_DEFAULT_ATTEMPTS: Joi.number().default(3),

  // Queue monitoring
  QUEUE_MONITOR_INTERVAL_MS: Joi.number().default(60000),
});

/**
 * Default configuration for BullMQ and Redis
 */
export const bullmqConfigDefault = {
  redis: {
    host: '127.0.0.1',
    port: 6379,
    maxConnections: 50,
    enableTls: false,
    isCluster: false,
  },
  queue: {
    prefix: 'bull',
    monitoring: {
      enabled: false,
      interval: 60000,
    },
    jobRetention: {
      completedHours: 24,
      completedCount: 1000,
      failedDays: 7,
    },
    defaultAttempts: 3,
  },
};
