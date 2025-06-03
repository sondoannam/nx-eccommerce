import { Module, Global } from '@nestjs/common';
import { PrismaBaseModule, PrismaProductModule } from './clients';

/**
 * Shared Prisma Module that provides access to all Prisma database clients
 */
@Global()
@Module({
  imports: [PrismaBaseModule, PrismaProductModule],
  exports: [PrismaBaseModule, PrismaProductModule],
})
export class SharedPrismaModule {}
