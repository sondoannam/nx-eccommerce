import { Module } from '@nestjs/common';
import { AbstractModule } from './abstract';
import { BullmqConfigModule } from './bullmq-config';
import { DtosModule } from './dtos';
import { ErrorHandlerModule } from './error-handler';
import { MiddlewareModule } from './middleware';
import { SwaggerConfigModule } from './swagger-config';
import { UtilsModule } from './utils';

@Module({
  imports: [
    AbstractModule,
    BullmqConfigModule,
    DtosModule,
    ErrorHandlerModule,
    MiddlewareModule,
    SwaggerConfigModule,
    UtilsModule,
  ],
  exports: [
    AbstractModule,
    BullmqConfigModule,
    DtosModule,
    ErrorHandlerModule,
    MiddlewareModule,
    SwaggerConfigModule,
    UtilsModule,
  ],
})
export class SharedModule {}
