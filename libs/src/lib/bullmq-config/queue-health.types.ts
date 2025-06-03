/**
 * Types for queue health reporting
 */

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  failureRate: number;
  processingSpeed: number | null;
}

export interface QueueHealthInfo {
  isHealthy: boolean;
  metrics: QueueMetrics;
  redisConnected: boolean;
}

export type QueueHealthError = {
  isHealthy: boolean;
  error: string;
};

export type QueueHealthResults = Record<
  string,
  QueueHealthInfo | QueueHealthError
>;
