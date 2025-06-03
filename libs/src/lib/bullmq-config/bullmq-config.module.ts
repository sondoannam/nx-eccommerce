import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BullmqConfigService } from './bullmq.config';
import { Queue } from 'bullmq';
import { QueueName } from './bullmq.types';
import {
  bullmqConfigSchema,
  bullmqConfigDefault,
} from './bullmq-config.schema';

/**
 * BullMQ configuration module that provides centralized queue management
 * with enhanced error handling and monitoring capabilities
 */
@Module({
  imports: [ConfigModule],
  providers: [BullmqConfigService],
  exports: [BullmqConfigService],
})
export class BullmqConfigModule {
  /**
   * Register BullMQ module with specified queues for a microservice
   * @param queueNames Array of queue names to register
   * @returns DynamicModule configured with the specified queues
   */ /**
   * Register BullMQ module with enhanced configuration options
   * @param options Configuration options for the module
   * @returns DynamicModule configured with the specified options
   */
  static forRoot(options?: {
    configOptions?: {
      isGlobal?: boolean;
      envFilePath?: string | string[];
    };
    validateSchema?: boolean;
  }): DynamicModule {
    return {
      module: BullmqConfigModule,
      global: options?.configOptions?.isGlobal ?? false,
      imports: [
        ConfigModule.forRoot({
          isGlobal: options?.configOptions?.isGlobal ?? false,
          envFilePath: options?.configOptions?.envFilePath,
          validationSchema: options?.validateSchema
            ? bullmqConfigSchema
            : undefined,
          validationOptions: { abortEarly: false },
          load: [() => bullmqConfigDefault],
        }),
      ],
      providers: [BullmqConfigService],
      exports: [BullmqConfigService],
    };
  }

  static forQueues(queueNames: string[]): DynamicModule {
    return {
      module: BullmqConfigModule,
      imports: [
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const bullConfigService = new BullmqConfigService(configService);
            return {
              connection: bullConfigService.getRedisConfig(),
            };
          },
          inject: [ConfigService],
        }),
        ...queueNames.map((name) =>          BullModule.registerQueueAsync({
            name,
            imports: [ConfigModule],
            useFactory: async (
              configService: ConfigService,
              bullConfigService: BullmqConfigService
            ) => {
              // Get queue options (which already includes the connection property)
              return bullConfigService.getDefaultQueueOptions(name as QueueName);
            },
            inject: [ConfigService, BullmqConfigService],
          })
        ),
      ],
      providers: [
        // Register queue providers for monitoring and metrics
        ...this.createQueueProviders(queueNames as QueueName[]),
      ],
      exports: [BullModule, BullmqConfigService],
    };
  }

  /**
   * Create queue providers with automatic registration in the BullmqConfigService
   * @param queueNames Queue names to create providers for
   * @returns Array of queue providers
   */
  private static createQueueProviders(queueNames: QueueName[]): Provider[] {
    return queueNames.map((name) => ({
      provide: `QUEUE_${name.toUpperCase()}`,
      useFactory: async (
        queue: Queue,
        bullConfigService: BullmqConfigService
      ) => {
        await bullConfigService.registerQueue(name, queue);
        return queue;
      },
      inject: [`BullQueue_${name}`, BullmqConfigService],
    }));
  }

  /**
   * Register BullMQ health check endpoints for monitoring
   * @returns DynamicModule with health check controllers
   */
  static withHealthChecks(): DynamicModule {
    return {
      module: BullmqConfigModule,
      imports: [ConfigModule],
      providers: [BullmqConfigService],
      exports: [BullmqConfigService],
    };
  }
}
