import { Module, Global, DynamicModule } from '@nestjs/common';

/**
 * Module that provides Swagger configuration utilities
 * This is used to configure Swagger documentation for API endpoints
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class SwaggerConfigModule {
  /**
   * Creates a dynamic module for swagger configuration
   * @param options Configuration options
   * @returns Dynamic module
   */
  static forRoot(options = {}): DynamicModule {
    return {
      module: SwaggerConfigModule,
      providers: [
        {
          provide: 'SWAGGER_OPTIONS',
          useValue: options,
        },
      ],
      exports: ['SWAGGER_OPTIONS'],
    };
  }
}
