/**
 * Shared Prisma module for database connections and operations
 * This module can be imported by any microservice that needs database access
 */
import { PrismaClient } from 'generated/prisma';
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.setupLogging();
  }

  /**
   * Connect to the database when the module initializes
   */
  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error(
        `Failed to connect to database: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Disconnect from the database when the module is destroyed
   */
  async onModuleDestroy() {
    try {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.logger.log('Successfully disconnected from database');
    } catch (error) {
      this.logger.error(
        `Error during database disconnect: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Setup logging for Prisma queries and errors
   */
  private setupLogging() {
    // @ts-expect-error - These events are available but not in the TypeScript definitions
    this.$on('query', (e: any) => {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      }
    });

    // @ts-expect-error - These events are available but not in the TypeScript definitions
    this.$on('error', (e: any) => {
      this.logger.error(`Database error: ${e.message}`, e.stack);
    });
  }

  /**
   * Execute a function within a transaction
   * @param fn Function to execute within transaction
   */
  async executeInTransaction<T>(
    fn: (prisma: PrismaService) => Promise<T>
  ): Promise<T> {
    return this.$transaction(async (prisma) => {
      return fn(prisma as unknown as PrismaService);
    });
  }
}
