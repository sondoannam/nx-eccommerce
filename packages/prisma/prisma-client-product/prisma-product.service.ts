import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractPrismaService } from '../../libs/prisma';

/**
 * Product-specific Prisma service
 * Uses the product schema.prisma file
 */
@Injectable()
export class PrismaProductService extends AbstractPrismaService {
  constructor(configService: ConfigService) {
    super(
      configService,
      // Path to the product schema
      'packages/prisma/prisma-schema-product/schema.prisma'
    );
  }

  // You can add product-specific methods here
}
