import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global module that provides PrismaService throughout the application
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
