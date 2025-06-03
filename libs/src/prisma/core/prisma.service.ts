import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractPrismaService } from './abstract-prisma.service';

/**
 * Default Prisma service for database interactions
 * Uses the root schema.prisma file
 */
@Injectable()
export class PrismaService extends AbstractPrismaService {
  /**
   * Constructor that creates a default PrismaClient instance
   * Uses the root schema.prisma file
   */
  constructor(configService: ConfigService) {
    super(configService, 'prisma/schema.prisma', 'DATABASE_URL');
  }
}
