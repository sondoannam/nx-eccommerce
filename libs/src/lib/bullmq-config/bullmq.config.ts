import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectionOptions,
  Queue,
  QueueEvents,
  QueueOptions,
  RedisClient,
} from 'bullmq';
import { QueueName, QueueJobData } from './bullmq.types';
import { QueueHealthInfo, QueueHealthResults } from './queue-health.types';

/**
 * Advanced BullMQ configuration service providing centralized queue management
 * with robust error handling and monitoring capabilities
 */
@Injectable()
export class BullmqConfigService implements OnModuleDestroy {
  private readonly logger = new Logger(BullmqConfigService.name);

  // Track all managed queues
  private queues: Map<QueueName, Queue> = new Map();

  // Track all queue event handlers
  private queueEvents: Map<QueueName, QueueEvents> = new Map();

  // Redis client for health checks
  private redisClient: RedisClient | null = null;

  constructor(private readonly configService: ConfigService) {
    this.setupMonitoring();
  }

  /**
   * Get Redis connection configuration from environment variables
   * Enhanced to support cloud Redis services, clustering, and TLS
   */
  getRedisConfig(): ConnectionOptions {
    const host = this.configService.get<string>('REDIS_HOST', '127.0.0.1');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const username = this.configService.get<string>('REDIS_USERNAME', '');
    const password = this.configService.get<string>('REDIS_PASSWORD', '');
    const isCluster = this.configService.get<boolean>('REDIS_CLUSTER', false);
    const maxConnections = this.configService.get<number>(
      'REDIS_MAX_CONNECTIONS',
      50
    );
    const enableTls = this.configService.get<boolean>(
      'REDIS_TLS_ENABLED',
      false
    );

    // Whether to use TLS (for cloud Redis services)
    const tls =
      enableTls ||
      host?.includes('upstash.io') ||
      host?.includes('redis.cloud') ||
      host?.includes('redislabs')
        ? {}
        : undefined;

    return {
      host,
      port,
      username: username || undefined,
      password: password || undefined,

      // Connection settings
      retryDelayOnFailover: 300, // Increased for cloud Redis latency
      maxRetriesPerRequest: null, // Retry until disconnected
      lazyConnect: true, // Only connect when needed

      // Network settings
      family: 4, // IPv4
      keepAlive: 15000, // Increased keepalive
      connectTimeout: 30000, // 30 seconds for initial connection
      commandTimeout: 15000, // 15 seconds for commands

      // Security and special cases
      tls,

      // Redis efficiency settings
      enableReadyCheck: false, // Faster startup
      enableOfflineQueue: true, // Queue commands when disconnected      // Connection pool settings for high-throughput
      maxLoadingRetryTime: 10000,
      // minimumCompatibleVersion is no longer supported in this version of BullMQ

      // Redis Sentinel/Cluster support
      sentinels: isCluster ? this.getSentinels() : undefined,
      sentinelPassword: isCluster ? password : undefined,
      name: isCluster ? 'mymaster' : undefined, // Master name for Sentinel

      // Connection retry strategy
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'];
        for (const errMsg of targetErrors) {
          if (err.message.includes(errMsg)) {
            this.logger.warn(
              `Redis connection error: ${errMsg}. Attempting reconnect.`
            );
            return true; // Try to reconnect
          }
        }
        return false; // Don't reconnect for other errors
      },

      // More nuanced retry strategy for various error conditions
      retryStrategy: (times: number) => {
        // Exponential backoff with max of 10 seconds between retries
        const delay = Math.min(times * 250, 10000);
        this.logger.debug(
          `Redis retry attempt #${times}, delaying by ${delay}ms`
        );
        return delay;
      },
    };
  }

  /**
   * Get Redis Sentinel configuration for clustered deployments
   */
  private getSentinels() {
    const sentinels = this.configService.get<string>('REDIS_SENTINELS', '');
    if (!sentinels) return undefined;

    try {
      return sentinels.split(',').map((sentinel) => {
        const [host, port] = sentinel.split(':');
        return { host, port: parseInt(port, 10) };
      });
    } catch (error) {
      this.logger.error('Failed to parse Redis sentinels configuration', error);
      return undefined;
    }
  }
  /**
   * Get default queue options with improved settings for resilience
   * @param queueName Optional queue name to customize settings per queue
   */
  getDefaultQueueOptions(queueName?: QueueName): QueueOptions {
    const defaultSettings: QueueOptions = {
      connection: this.getRedisConfig(), // Add required connection property
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
        attempts: 3, // Default retry attempts
        backoff: {
          type: 'exponential' as const,
          delay: 2000,
        },
        // JobId is handled when adding jobs, not in default options
      },
      // Enable BullMQ streams for improved performance
      streams: {
        events: {
          maxLen: 10000,
        },
      },
      prefix: this.configService.get('QUEUE_PREFIX', 'bull'),
    }; // Custom settings for specific queues
    if (queueName) {
      switch (queueName) {
        case 'email-notification':
          return {
            ...defaultSettings,
            defaultJobOptions: {
              ...defaultSettings.defaultJobOptions,
              attempts: 5, // More retries for email notifications
              backoff: { type: 'exponential', delay: 5000 },
            },
          };
        case 'email-otp':
          return {
            ...defaultSettings,
            defaultJobOptions: {
              ...defaultSettings.defaultJobOptions,
              attempts: 4,
              backoff: { type: 'exponential', delay: 3000 },
              // Time-sensitive OTPs should expire sooner
              removeOnComplete: { age: 3600, count: 100 },
            },
          };
        default:
          return defaultSettings;
      }
    }

    return defaultSettings;
  }

  /**
   * Register a queue for monitoring and management
   * @param name Queue name
   * @param queue BullMQ queue instance
   */
  async registerQueue<T extends QueueName>(
    name: T,
    queue: Queue<QueueJobData[T]>
  ): Promise<void> {
    this.queues.set(name, queue);
    this.logger.log(`Registered queue: ${name}`);

    // Set up queue events with enhanced error handling
    try {
      const queueEvents = new QueueEvents(name, {
        connection: this.getRedisConfig(),
      });

      await queueEvents.waitUntilReady();
      this.queueEvents.set(name, queueEvents);

      // Setup event listeners with improved logging
      this.setupQueueEventListeners(name, queueEvents);

      this.logger.log(`Queue events registered for ${name}`);
    } catch (error) {
      this.logger.error(`Failed to set up queue events for ${name}`, error);
    }
  }

  /**
   * Set up event listeners for a queue
   * @param name Queue name
   * @param queueEvents QueueEvents instance
   */
  private setupQueueEventListeners(
    name: QueueName,
    queueEvents: QueueEvents
  ): void {
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      this.logger.debug(`Job ${jobId} completed in queue ${name}`);

      // Log any useful return values in debug mode
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      if (returnvalue && !isProduction) {
        try {
          const result =
            typeof returnvalue === 'string'
              ? JSON.parse(returnvalue)
              : returnvalue;
          this.logger.debug(`Job ${jobId} result: ${JSON.stringify(result)}`);
        } catch (_) {
          // Ignore parsing errors
        }
      }
    });

    queueEvents.on('failed', ({ jobId, failedReason, prev }) => {
      // Log more context when jobs fail
      const attempt = prev ? 'Retry failed' : 'Initial attempt failed';
      this.logger.error(
        `${attempt} for job ${jobId} in queue ${name}: ${failedReason}`
      );
    });

    queueEvents.on('stalled', ({ jobId }) => {
      this.logger.warn(
        `Job ${jobId} stalled in queue ${name}. Check for long-running workers.`
      );
    });

    // Additional useful events
    queueEvents.on('progress', ({ jobId, data }) => {
      this.logger.debug(`Job ${jobId} reported progress: ${data}`);
    });

    queueEvents.on('error', (error) => {
      this.logger.error(`Queue ${name} encountered an error:`, error);
    });
  }

  /**
   * Setup periodic monitoring of Redis and queue health
   */
  private setupMonitoring(): void {
    if (this.configService.get('ENABLE_QUEUE_MONITORING', false)) {
      // Perform health checks at regular intervals
      setInterval(() => {
        this.checkRedisConnection();
      }, 60000); // Check every minute
    }
  }

  /**
   * Check Redis connection health
   */
  private async checkRedisConnection(): Promise<boolean> {
    try {
      if (!this.redisClient) {
        const Redis = require('ioredis');
        const config = this.getRedisConfig();
        this.redisClient = new Redis(config);
      }

      const pong = await this.redisClient?.ping();
      return pong === 'PONG';
    } catch (error) {
      this.logger.error('Redis connection check failed', error);
      return false;
    }
  }

  /**
   * Get detailed queue health status including metrics
   * @param name Queue name
   * @returns Health status object with metrics
   */ async getQueueHealth(name: QueueName): Promise<QueueHealthInfo> {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found. Register it first.`);
    }

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      isPaused,
      redisConnected,
    ] = await Promise.all([
      queue.getWaitingCount().catch(() => 0),
      queue.getActiveCount().catch(() => 0),
      queue.getCompletedCount().catch(() => 0),
      queue.getFailedCount().catch(() => 0),
      queue.getDelayedCount().catch(() => 0),
      queue.isPaused().catch(() => false),
      this.checkRedisConnection(),
    ]);

    // Calculate failure metrics
    const totalJobs = completed + failed || 1; // Avoid division by zero
    const failureRate = failed / totalJobs; // Calculate approximate processing speed (jobs per minute)
    let processingSpeed = null;
    try {
      const recentJobs = await queue.getJobs(['completed'], 0, 60, true);
      if (recentJobs.length > 0) {
        processingSpeed = recentJobs.length;
      }
    } catch (_) {
      this.logger.warn(`Failed to calculate processing speed for ${name}`);
    }

    // Consider queue unhealthy if any of these conditions are true:
    // 1. Redis is disconnected
    // 2. Failure rate is >10%
    // 3. Too many waiting jobs (queue building up)
    // 4. Queue is paused
    const isHealthy =
      redisConnected && failureRate < 0.1 && waiting < 1000 && !isPaused;

    return {
      isHealthy,
      metrics: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused: isPaused,
        failureRate,
        processingSpeed,
      },
      redisConnected,
    };
  }
  /**
   * Get health status for all registered queues
   * @returns Health status for all registered queues
   */
  async getAllQueuesHealth(): Promise<QueueHealthResults> {
    const results: QueueHealthResults = {};

    // Convert Map.entries() to array to avoid iterator compatibility issues
    const queueEntries = Array.from(this.queues.entries());

    for (const [name] of queueEntries) {
      try {
        results[name] = await this.getQueueHealth(name as QueueName);
      } catch (error) {
        this.logger.error(`Failed to get health for queue ${name}`, error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results[name] = { isHealthy: false, error: errorMessage };
      }
    }

    return results;
  }

  /**
   * Pause a queue (stops processing new jobs)
   * @param name Queue name
   */
  async pauseQueue(name: QueueName): Promise<void> {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    await queue.pause();
    this.logger.log(`Queue ${name} paused`);
  }

  /**
   * Resume a paused queue
   * @param name Queue name
   */
  async resumeQueue(name: QueueName): Promise<void> {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    await queue.resume();
    this.logger.log(`Queue ${name} resumed`);
  }

  /**
   * Clean up resources on module destroy
   * Properly closes all connections to prevent resource leaks
   */ async onModuleDestroy() {
    this.logger.log('Shutting down BullMQ connections...');

    // Close all queue connections
    // Convert Map to array to avoid iterator compatibility issues
    const queueEntries = Array.from(this.queues.entries());

    for (const [name, queue] of queueEntries) {
      try {
        this.logger.debug(`Closing queue: ${name}`);
        await queue.close();

        const queueEvents = this.queueEvents.get(name);
        if (queueEvents) {
          await queueEvents.close();
        }
      } catch (error) {
        this.logger.error(`Error closing queue ${name}:`, error);
      }
    }

    // Close Redis client if it exists
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (error) {
        this.logger.error('Error closing Redis client:', error);
      }
    }

    this.queues.clear();
    this.queueEvents.clear();
    this.redisClient = null;

    this.logger.log('BullMQ shutdown complete');
  }
}
