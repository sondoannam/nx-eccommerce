import { Module, Global } from '@nestjs/common';
import { PrismaProductService } from './prisma-product.service';

/**
 * Module that provides the PrismaProductService
 * Should be imported in modules that need access to product data
 */
@Global()
@Module({
  providers: [PrismaProductService],
  exports: [PrismaProductService],
})
export class PrismaProductModule {}
