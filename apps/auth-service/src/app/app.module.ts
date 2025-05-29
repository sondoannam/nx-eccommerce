import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { ErrorLoggerMiddleware } from 'packages/error-handler';
import { PrismaModule } from 'packages/libs/prisma';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Database
    PrismaModule,
    // Feature modules
    HealthModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ErrorLoggerMiddleware).forRoutes('*');
  }
}
