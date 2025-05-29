import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma service for database interactions
 * Extends PrismaClient with additional features for NestJS
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  /**
   * Constructor that creates a new PrismaClient instance
   * Can be configured with connection options if needed
   */
  constructor(private readonly configService: ConfigService) {
    super({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });
  }

  /**
   * Hook called when the module is initialized
   * Connects to the database
   */
  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connection established');
  }
}
