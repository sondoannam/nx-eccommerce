import { Module, Global } from '@nestjs/common';
import { PrismaBaseService } from './prisma-base.service';

/**
 * Module that provides the PrismaBaseService
 * Should be imported in modules that need access to base data
 */
@Global()
@Module({
  providers: [PrismaBaseService],
  exports: [PrismaBaseService],
})
export class PrismaBaseModule {}
