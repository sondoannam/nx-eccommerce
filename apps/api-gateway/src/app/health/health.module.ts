import { Module } from '@nestjs/common';
import { TerminusModule, HealthIndicatorService } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { SystemMetricsHealthIndicator } from './indicators/system-metrics.health';
import { DatabaseHealthIndicator } from './indicators/database.health';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
  providers: [
    HealthIndicatorService,
    SystemMetricsHealthIndicator,
    DatabaseHealthIndicator,
  ],
  exports: [SystemMetricsHealthIndicator, DatabaseHealthIndicator],
})
export class HealthModule {}
