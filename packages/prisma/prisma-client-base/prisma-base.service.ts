import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractPrismaService } from '../../libs/prisma';

/**
 * Base-specific Prisma service
 * Uses the Base schema.prisma file
 */
@Injectable()
export class PrismaBaseService extends AbstractPrismaService {
  constructor(configService: ConfigService) {
    super(
      configService,
      // Path to the Base schema
      'packages/prisma/prisma-schema-base/schema.prisma'
    );
  }

  // You can add Base-specific methods here
}
