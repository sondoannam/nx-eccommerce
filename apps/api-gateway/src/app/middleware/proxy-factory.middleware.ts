import { Injectable, NestMiddleware } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request, Response } from 'express';

/**
 * Factory function to create proxy middlewares for different microservices
 * @param path The path to match (e.g. 'auth-service')
 * @param targetUrl The target URL for the proxy
 * @returns A middleware class
 */
export function createProxyMiddlewareFactory(path: string, targetUrl: string) {
  @Injectable()
  class GeneratedProxyMiddleware implements NestMiddleware {
    private readonly proxy = createProxyMiddleware<Request, Response>({
      target: targetUrl,
      changeOrigin: true,
      pathFilter: `/api/${path}`,
      pathRewrite: {
        [`^/api/${path}`]: '/api', // Remove the path from the request
      },
      on: {
        proxyRes: (proxyRes, req) => {
          // Log when proxy receives a response
          console.log(
            `[Proxy] ${req.method} ${req.url} -> ${proxyRes.statusCode}`
          );
        },
        error: (err, req, res) => {
          // Handle proxy errors
          console.error(`[Proxy Error for ${path}]`, err);
          // Check if res is an Express Response object with status method
          if (res && 'status' in res && typeof res.status === 'function') {
            res
              .status(500)
              .json({ message: 'Proxy Error', error: err.message });
          }
        },
      },
    });

    use(req: Request, res: Response, next: () => void) {
      // Forward the request to the target service
      this.proxy(req, res, next);
    }
  }

  return GeneratedProxyMiddleware;
}
