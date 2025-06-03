import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerConfigOptions {
  title: string;
  description: string;
  version: string;
  path?: string;
  tags?: string[];
}

/**
 * Configures Swagger documentation for a NestJS application
 *
 * @param app The NestJS application instance
 * @param options Configuration options for Swagger
 * @returns The OpenAPI document object
 */
export function setupSwagger(
  app: INestApplication,
  options: SwaggerConfigOptions
): OpenAPIObject {
  const { title, description, version, path = 'api/docs', tags = [] } = options;

  // Create the Swagger document builder
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .build();

  // Add tags if provided
  tags.forEach((tag) => config.tags?.push({ name: tag }));

  // Create the Swagger document
  const document = SwaggerModule.createDocument(app, config);

  // Set up the Swagger UI
  SwaggerModule.setup(path, app, document);

  return document;
}

/**
 * Creates service-specific Swagger options
 * @param serviceName The name of the microservice
 * @returns Swagger configuration options
 */
export function createServiceSwaggerOptions(
  serviceName: string
): SwaggerConfigOptions {
  return {
    title: `${serviceName} API`,
    description: `API endpoints for the ${serviceName}`,
    version: '1.0',
    path: 'api/docs',
    tags: [serviceName],
  };
}
