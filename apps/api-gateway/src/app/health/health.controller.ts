import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheckResult,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { servicesConfig } from '../config/services.config';
import { SystemMetricsHealthIndicator } from './indicators/system-metrics.health';
import { DatabaseHealthIndicator } from './indicators/database.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private systemMetrics: SystemMetricsHealthIndicator,
    private database: DatabaseHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Gateway system health
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024), // 3GB
      () =>
        this.disk.checkStorage('disk', { thresholdPercent: 0.9, path: '/' }),
      () => this.systemMetrics.checkCpuLoad('cpu', { threshold: 0.8 }),
      () => this.systemMetrics.checkUptime('uptime', { minimumUptime: 60 }), // At least 1 minute uptime

      // Uncomment when you have actual database connections
      // () => this.database.isHealthy('database'),

      // Microservices health
      ...this.getServicesHealthChecks(),
    ]);
  }

  @Get('services')
  getServicesInfo() {
    const services = servicesConfig.map((service) => ({
      name: service.description,
      url: service.targetUrl,
      path: service.path,
    }));

    return {
      timestamp: new Date().toISOString(),
      gateway: {
        name: 'API Gateway',
        version: process.env.npm_package_version || '1.0.0',
      },
      services,
    };
  }
  private getServicesHealthChecks() {
    return servicesConfig.map((service) => {
      const healthEndpoint = `${service.targetUrl}/api/health`;

      return () =>
        this.http.pingCheck(
          `${service.path}`,
          healthEndpoint,
          { timeout: 3000 } // 3 seconds timeout
        );
    });
  }

  @Get('liveness')
  async getLiveness() {
    // Quick check that doesn't check downstream services, suitable for container liveness probes
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @HealthCheck()
  async getReadiness(): Promise<HealthCheckResult> {
    // Full check including downstream services, suitable for container readiness probes
    return this.check();
  }
}
