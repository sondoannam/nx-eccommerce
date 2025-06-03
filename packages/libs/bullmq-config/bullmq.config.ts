import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionOptions, Queue, QueueEvents } from 'bullmq';
import { QueueName, QueueJobData } from './index';

/**
 * Service to provide BullMQ configuration from ConfigService
 */
@Injectable()
export class BullmqConfigService implements OnModuleDestroy {
  private queues: Map<QueueName, Queue> = new Map();
  private queueEvents: Map<QueueName, QueueEvents> = new Map();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get Redis connection configuration from environment variables
   */
  getRedisConfig(): ConnectionOptions {
    const host = this.configService.get<string>('REDIS_HOST', '127.0.0.1');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    return {
      host,
      port,
      password,
      retryDelayOnFailover: 200, // Increased to allow for cloud Redis latency
      maxRetriesPerRequest: null,
      lazyConnect: true, // Connection pool settings for better performance
      family: 4,
      keepAlive: 10000,
      connectTimeout: 30000, // Increased timeout for cloud services
      commandTimeout: 15000,
      tls: host?.includes('upstash.io') ? {} : undefined,
      enableReadyCheck: false,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
      enableOfflineQueue: true,
      retryStrategy: (times: number) => {
        return Math.min(times * 200, 2000);
      },
    };
  }

  /**
   * Get default queue options with improved settings
   */
  getDefaultQueueOptions() {
    return {
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 2000,
        },
      },
      streams: {
        events: {
          maxLen: 10000,
        },
      },
    };
  }

  /**
   * Register a queue for monitoring
   */
  async registerQueue<T extends QueueName>(
    name: T,
    queue: Queue<QueueJobData[T]>
  ): Promise<void> {
    this.queues.set(name, queue);
    
    // Set up queue events
    const queueEvents = new QueueEvents(name, {
      connection: this.getRedisConfig(),
    });
    this.queueEvents.set(name, queueEvents);

    // Listen for queue events
    queueEvents.on('completed', ({ jobId }) => {
      console.log(`Job ${jobId} completed in queue ${name}`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed in queue ${name}: ${failedReason}`);
    });

    queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`Job ${jobId} stalled in queue ${name}`);
    });
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(name: QueueName): Promise<{
    isHealthy: boolean;
    metrics: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  }> {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    // Consider queue unhealthy if there are too many failed jobs
    const failureRate = failed / (completed + failed || 1);
    const isHealthy = failureRate < 0.1; // Less than 10% failure rate

    return {
      isHealthy,
      metrics: {
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
    };
  }

  /**
   * Clean up resources on module destroy
   */
  async onModuleDestroy() {
    // Close all queue connections
    for (const [name, queue] of this.queues) {
      await queue.close();
      const queueEvents = this.queueEvents.get(name);
      if (queueEvents) {
        await queueEvents.close();
      }
    }

    this.queues.clear();
    this.queueEvents.clear();
  }
}
