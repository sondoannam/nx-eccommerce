import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import * as os from 'os';

/**
 * Custom health indicator for system metrics
 */
@Injectable()
export class SystemMetricsHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  /**
   * Check if CPU load is within acceptable limits
   * @param key The key which will be used for the result object
   * @param options Options for the check including threshold values
   * @returns The health indicator result
   */
  async checkCpuLoad(
    key: string,
    options: { threshold: number } = { threshold: 0.9 }
  ) {
    const indicator = this.healthIndicatorService.check(key);
    const cpuLoad = await this.getCpuLoad();
    const isHealthy = cpuLoad < options.threshold;

    const details = {
      cpuLoad: cpuLoad.toFixed(2),
      threshold: options.threshold.toFixed(2),
    };

    if (isHealthy) {
      return indicator.up(details);
    }

    return indicator.down(details);
  }

  /**
   * Check if system uptime is above a minimum required value
   * @param key The key which will be used for the result object
   * @param options Options for the check including minimum uptime in seconds
   * @returns The health indicator result
   */
  async checkUptime(
    key: string,
    options: { minimumUptime: number } = { minimumUptime: 60 } // 1 minute by default
  ) {
    const indicator = this.healthIndicatorService.check(key);
    const uptime = os.uptime();
    const isHealthy = uptime >= options.minimumUptime;

    const details = {
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor(
        (uptime % 3600) / 60
      )}m ${Math.floor(uptime % 60)}s`,
      required: `${Math.floor(options.minimumUptime / 3600)}h ${Math.floor(
        (options.minimumUptime % 3600) / 60
      )}m ${Math.floor(options.minimumUptime % 60)}s`,
    };

    if (isHealthy) {
      return indicator.up(details);
    }

    return indicator.down(details);
  }

  /**
   * Get the current CPU load average
   * @returns {Promise<number>} CPU load value between 0 and 1
   */
  private async getCpuLoad(): Promise<number> {
    return new Promise((resolve) => {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      // CPU load is represented as a value between 0 and 1
      // where 0 means idle and 1 means maximum load
      const load = 1 - totalIdle / totalTick;
      resolve(load);
    });
  }
}
