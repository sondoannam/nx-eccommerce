import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

/**
 * Database health indicator for checking database connectivity
 * This is a base class that can be extended with specific database implementations
 */
@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly connectionName = 'database'
  ) {}

  /**
   * Checks if the database is healthy
   * @param key The key which will be used for the result object
   * @returns The health indicator result
   */
  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // This is where you would implement database-specific health checks
      // For example, try to execute a simple query

      // Simulating a database check
      await this.checkConnection();

      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: `${this.connectionName} check failed: ${error.message}`,
      });
    }
  }

  /**
   * Check database connection
   * Override this method in a derived class with actual database connection check
   */
  protected async checkConnection(): Promise<void> {
    // This should be overridden by database-specific implementations
    return Promise.resolve();
  }
}
