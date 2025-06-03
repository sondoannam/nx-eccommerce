import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractPrismaService } from '../../core/abstract-prisma.service';

/**
 * Base-specific Prisma service
 * Uses the Base schema.prisma file
 */
@Injectable()
export class PrismaBaseService extends AbstractPrismaService {
  constructor(configService: ConfigService) {
    super(configService, '../../schemas/base/schema.prisma', 'BASE_DATABASE_URL');
  }

  // Add Base-specific methods here
}
