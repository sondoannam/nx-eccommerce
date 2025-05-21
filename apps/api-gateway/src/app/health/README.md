# Health Check System

This document outlines the health check system implemented for the Multi-Vendor SaaS Platform.

## Overview

The platform utilizes the NestJS Terminus health check library to monitor the status of all services, including the API Gateway and microservices. The health check system provides various endpoints that can be used by monitoring tools, load balancers, container orchestrators (like Kubernetes), and administrators.

## Endpoints

### API Gateway Health Endpoints

- `GET /health`: Full health check that includes gateway and all microservices
- `GET /health/services`: Information about all registered microservices
- `GET /health/liveness`: Simple liveness probe (for container health checks)
- `GET /health/readiness`: Full readiness probe (checks all dependencies)

### Microservices Health Endpoints

Each microservice exposes:

- `GET /health`: Full health check for the specific microservice
- `GET /health/info`: Basic information about the microservice
- `GET /health/liveness`: Simple liveness probe
- `GET /health/readiness`: Full readiness probe

## Monitored Components

The health check system monitors:

- **Memory Usage**: Heap and RSS memory consumption
- **Disk Space**: Available storage and thresholds
- **CPU Load**: System CPU utilization
- **System Uptime**: Service uptime monitoring
- **Database Connectivity**: Connection status (when implemented)
- **Microservice Availability**: Status of all downstream services

## Usage

### PowerShell Health Monitor

Run the included PowerShell script to check the health of all services:

```powershell
.\health-monitor.ps1
```

### Docker/Kubernetes Integration

For container orchestration, use the following probe configurations:

```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Custom Health Indicators

The system includes custom health indicators:

1. `DatabaseHealthIndicator`: Base class for database connection health checks
2. `SystemMetricsHealthIndicator`: System-level metrics monitoring

To extend with additional health indicators, use the `HealthIndicatorService` from `@nestjs/terminus`. This is the recommended approach as of NestJS Terminus v11, as the previous approach using `HealthIndicator` class has been deprecated.

## Response Format

Health check endpoints return a standardized JSON response:

```json
{
  "status": "ok",
  "info": {
    "memory_heap": {
      "status": "up"
    },
    "disk": {
      "status": "up"
    },
    "auth-service": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "memory_heap": {
      "status": "up"
    },
    "disk": {
      "status": "up",
      "message": "Available: 120GB (75%)"
    },
    "auth-service": {
      "status": "up"
    }
  }
}
```

## Implementation Details

The health check system utilizes:

- `@nestjs/terminus` for the health check framework
- `@nestjs/axios` for HTTP health checks between services
- Custom health indicators for specific monitoring requirements

## Health Indicator Implementation

As of Terminus v11, there are two ways to implement custom health indicators:

### Modern Approach (Recommended)

```typescript
@Injectable()
export class DogHealthIndicator {
  constructor(private readonly dogService: DogService, private readonly healthIndicatorService: HealthIndicatorService) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    // Your health check logic
    const isHealthy = await this.checkSomething();

    if (isHealthy) {
      return indicator.up({ additionalInfo: 'value' });
    } else {
      return indicator.down({ reason: 'Something went wrong' });
    }
  }
}
```

### Legacy Approach (Deprecated)

```typescript
@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Your health check logic
    const isHealthy = await this.checkSomething();

    const result = this.getStatus(key, isHealthy, { additionalInfo: 'value' });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Health check failed', result);
  }
}
```

The modern approach is more readable and avoids throwing exceptions for normal "down" states.
