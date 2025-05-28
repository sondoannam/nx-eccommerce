import { Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { bullMQRedisConfig, defaultQueueOptions } from './index';

/**
 * Shared BullMQ module that can be imported by microservices
 * This provides a consistent configuration across all services
 */
@Module({})
export class SharedBullMQModule {
  /**
   * Import specific queues for a microservice
   * @param queueNames Array of queue names to register
   * @returns DynamicModule configured with the specified queues
   */
  static forQueues(queueNames: string[]): DynamicModule {
    // Create queue configurations
    const imports = [
      BullModule.forRoot({
        connection: bullMQRedisConfig,
      }),
    ];

    // Register each queue individually to avoid spread operator issues
    queueNames.forEach((name) => {
      imports.push(
        BullModule.registerQueue({
          name,
          ...defaultQueueOptions,
        })
      );
    });

    return {
      module: SharedBullMQModule,
      imports,
      exports: [BullModule],
    };
  }

  /**
   * For root configuration - use this in your main app module
   */
  static forRoot(): DynamicModule {
    return {
      module: SharedBullMQModule,
      imports: [
        BullModule.forRoot({
          connection: bullMQRedisConfig,
        }),
      ],
      exports: [BullModule],
    };
  }
}
