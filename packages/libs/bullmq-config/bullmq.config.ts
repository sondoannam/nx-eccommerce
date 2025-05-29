import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionOptions } from 'bullmq';

/**
 * Service to provide BullMQ configuration from ConfigService
 */
@Injectable()
export class BullmqConfigService {
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
    };
  }

  /**
   * Get default queue options
   */
  getDefaultQueueOptions() {
    return {
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
  }
}
