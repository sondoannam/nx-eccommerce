import { Module, DynamicModule, Injectable } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { BullmqConfigService } from './bullmq.config';

/**
 * Shared BullMQ module that can be imported by microservices
 * This provides a consistent configuration across all services
 */
@Injectable()
@Module({
  imports: [ConfigModule],
  providers: [BullmqConfigService],
  exports: [BullmqConfigService],
})
export class SharedBullMQModule {
  /**
   * Import specific queues for a microservice
   * @param queueNames Array of queue names to register
   * @returns DynamicModule configured with the specified queues
   */
  static forQueues(queueNames: string[]): DynamicModule {
    return {
      module: SharedBullMQModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: BullmqConfigService) => ({
            connection: configService.getRedisConfig(),
          }),
          inject: [BullmqConfigService],
        }),
        ...queueNames.map((name) =>
          BullModule.registerQueueAsync({
            name,
            imports: [ConfigModule],
            useFactory: async (configService: BullmqConfigService) => ({
              connection: configService.getRedisConfig(),
              ...configService.getDefaultQueueOptions(),
            }),
            inject: [BullmqConfigService],
          })
        ),
      ],
      providers: [
        // Make sure BullmqConfigService is provided in this dynamic module
        // This avoids the circular dependency
        BullmqConfigService,
      ],
      exports: [BullModule, BullmqConfigService],
    };
  }

  /**
   * For root configuration - use this in your main app module
   */
  static forRoot(): DynamicModule {
    return {
      module: SharedBullMQModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: BullmqConfigService) => ({
            connection: configService.getRedisConfig(),
          }),
          inject: [BullmqConfigService],
        }),
      ],
      providers: [
        // Make sure BullmqConfigService is provided in this dynamic module
        BullmqConfigService,
      ],
      exports: [BullModule, BullmqConfigService],
    };
  }
}
