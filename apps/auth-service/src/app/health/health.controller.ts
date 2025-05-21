import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private healthIndicatorService: HealthIndicatorService
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // System health checks
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024), // 3GB
      () =>
        this.disk.checkStorage('disk', { thresholdPercent: 0.9, path: '/' }),

      // Service-specific checks can be added here
    ]);
  }
  @Get('info')
  getInfo() {
    return {
      name: 'Authentication Service',
      version: process.env.npm_package_version || '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('liveness')
  getLiveness() {
    // Quick check suitable for container liveness probes
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @HealthCheck()
  getReadiness(): Promise<HealthCheckResult> {
    // Full check suitable for container readiness probes
    return this.check();
  }
}
