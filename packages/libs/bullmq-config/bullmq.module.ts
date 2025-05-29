import { Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { BullmqConfigService } from './bullmq.config';

/**
 * Shared BullMQ module that can be imported by microservices
 * This provides a consistent configuration across all services
 */
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
          inject: [BullmqConfigService],
          useFactory: (configService: BullmqConfigService) => ({
            connection: configService.getRedisConfig(),
          }),
        }),
        ...queueNames.map(name => 
          BullModule.registerQueueAsync({
            imports: [ConfigModule],
            name,
            inject: [BullmqConfigService],
            useFactory: (configService: BullmqConfigService) => ({
              connection: configService.getRedisConfig(),
              ...configService.getDefaultQueueOptions(),
            }),
          })
        ),
      ],
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
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [BullmqConfigService],
          useFactory: (configService: BullmqConfigService) => ({
            connection: configService.getRedisConfig(),
          }),
        }),
      ],
      exports: [BullModule],
    };
  }
}
