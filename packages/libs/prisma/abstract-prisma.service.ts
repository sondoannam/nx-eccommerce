import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Abstract Prisma service that serves as a base for multiple Prisma clients
 * Each database can have its own client that extends this class
 */
@Injectable()
export abstract class AbstractPrismaService
  extends PrismaClient
  implements OnModuleInit
{
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Constructor that creates a new PrismaClient instance
   * @param configService - NestJS ConfigService for accessing environment variables
   * @param schemaPath - Path to the Prisma schema file, relative to project root
   * @param databaseUrlEnv - Name of the environment variable for database URL (defaults to DATABASE_URL)
   */ 
  constructor(
    protected readonly configService: ConfigService,
    protected readonly schemaPath?: string,
    protected readonly databaseUrlEnv = 'DATABASE_URL'
  ) {
    const databaseUrl = configService.get<string>(databaseUrlEnv);
    super({
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      ...(schemaPath && { schema: schemaPath }),
    });
  }

  /**
   * Hook called when the module is initialized
   * Connects to the database
   */
  async onModuleInit() {
    this.logger.log(
      `Connecting to database${
        this.schemaPath ? ` using schema: ${this.schemaPath}` : ''
      }...`
    );
    await this.$connect();
    this.logger.log('Database connection established');
  }
}
