import { Module, Global, DynamicModule } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global module that provides PrismaService throughout the application
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  /**
   * Creates a custom Prisma module with specific service providers
   * @param serviceProviders - Array of specific Prisma service providers
   * @returns A dynamic module that provides the specified Prisma services
   */
  static forRoot(serviceProviders: any[] = []): DynamicModule {
    return {
      module: PrismaModule,
      providers: [...serviceProviders],
      exports: [...serviceProviders],
      global: true,
    };
  }
}
