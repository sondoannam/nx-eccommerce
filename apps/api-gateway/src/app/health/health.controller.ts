import { Controller, Get } from '@nestjs/common';
import { servicesConfig } from '../config/services.config';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    const services = servicesConfig.map((service) => ({
      name: service.description,
      url: service.targetUrl,
      path: service.path,
    }));

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      gateway: {
        name: 'API Gateway',
        version: process.env.npm_package_version || '1.0.0',
      },
      services,
    };
  }
}
