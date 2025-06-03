import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerConfigOptions {
  /**
   * The title of the Swagger documentation
   */
  title: string;

  /**
   * The description of the API
   */
  description: string;

  /**
   * The version of the API
   */
  version: string;

  /**
   * The URL path for the Swagger UI (defaults to 'api/docs')
   */
  path?: string;

  /**
   * API tags for categorizing endpoints
   */
  tags?: string[];

  /**
   * Whether to enable bearer token authentication in Swagger
   */
  enableBearerAuth?: boolean;

  /**
   * URL for external Terms of Service
   */
  termsOfServiceUrl?: string;

  /**
   * Contact information for the API
   */
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };

  /**
   * License information for the API
   */
  license?: {
    name: string;
    url?: string;
  };

  /**
   * Base servers for the API
   */
  servers?: { url: string; description?: string }[];
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
  const {
    title,
    description,
    version,
    path = 'api/docs',
    tags = [],
    enableBearerAuth = true,
    termsOfServiceUrl,
    contact,
    license,
    servers,
  } = options;

  // Create the Swagger document builder
  const configBuilder = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version);

  // Configure additional options if provided
  if (enableBearerAuth) {
    configBuilder.addBearerAuth();
  }

  if (termsOfServiceUrl) {
    configBuilder.setTermsOfService(termsOfServiceUrl);
  }

  if (contact) {
    configBuilder.setContact(
      contact.name || '',
      contact.url || '',
      contact.email || ''
    );
  }

  if (license) {
    configBuilder.setLicense(license.name, license.url || '');
  }

  if (servers && servers.length > 0) {
    servers.forEach((server) => {
      configBuilder.addServer(server.url, server.description);
    });
  }

  // Build the configuration
  const config = configBuilder.build();

  // Add tags if provided
  tags.forEach((tag) => {
    if (config.tags) {
      config.tags.push({ name: tag });
    }
  });

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
    enableBearerAuth: true,
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    servers: [
      {
        url: '/',
        description: 'Current environment',
      },
    ],
  };
}
