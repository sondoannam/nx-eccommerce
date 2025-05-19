# API Gateway

This service acts as an API Gateway for the multi-vendor SaaS system, providing:

- Rate limiting with different thresholds for authenticated vs. unauthenticated users
- Proxy functionality to route requests to the appropriate microservices
- Health checking functionality

## Architecture

The API Gateway uses NestJS and http-proxy-middleware to route requests to various microservices:

- `/api/auth-service/*` → Authentication Service
- Additional services can be easily added by updating the services config

## Rate Limiting

All endpoints are protected by rate limiting:

- Unauthenticated users: 100 requests per 15 minutes
- Authenticated users: 1000 requests per 15 minutes

## Proxy Configuration

To add a new service to the API Gateway:

1. Update the `services.config.ts` file with your new service details
2. Add the service URL to the `.env` file
3. Restart the gateway service

## Example Requests

Access the auth service through the gateway:

```bash
# This request gets proxied to the auth service
curl http://localhost:8080/api/auth-service/login -d '{"email":"user@example.com","password":"password"}'
```

## Health Check

You can check the gateway status using:

```bash
curl http://localhost:8080/api/health
```

## Environment Variables

- `PORT`: The port on which the API Gateway runs (default: 8080)
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:3000)
- `AUTH_SERVICE_URL`: URL of the auth service (default: http://localhost:8001)
- Add more service URLs as needed
