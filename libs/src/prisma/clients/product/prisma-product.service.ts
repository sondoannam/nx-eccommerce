import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractPrismaService } from '../../core/abstract-prisma.service';

/**
 * Product-specific Prisma service
 * Uses the Product schema.prisma file
 */
@Injectable()
export class PrismaProductService extends AbstractPrismaService {
  constructor(configService: ConfigService) {
    super(configService, '../../schemas/product/schema.prisma', 'PRODUCT_DATABASE_URL');
  }

  // Add Product-specific methods here
}
