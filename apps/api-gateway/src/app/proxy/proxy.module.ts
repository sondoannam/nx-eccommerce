import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { createProxyMiddlewareFactory } from '../middleware/proxy-factory.middleware';
import { servicesConfig } from '../config/services.config';

@Module({})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Set up proxies for all configured services
    for (const service of servicesConfig) {
      const ProxyMiddleware = createProxyMiddlewareFactory(
        service.path,
        service.targetUrl
      );

      consumer.apply(ProxyMiddleware).forRoutes(service.path);

      console.log(
        `[Gateway] Proxy registered for ${service.description}: ${service.path} -> ${service.targetUrl}`
      );
    }
  }
}
