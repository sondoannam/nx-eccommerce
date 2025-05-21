import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import axios from 'axios';

/**
 * Swagger configuration for API Gateway
 * Aggregates Swagger documentation from multiple microservices
 */
export interface MicroserviceSwaggerConfig {
  name: string;
  url: string;
  docsPath: string;
}

/**
 * Aggregates Swagger documentation from multiple microservices
 * @param app The NestJS application instance (API Gateway)
 * @param microservices Configuration for microservices to aggregate docs from
 */
export async function setupAggregatedSwagger(
  app: INestApplication,
  microservices: MicroserviceSwaggerConfig[]
): Promise<void> {
  // Create the base Swagger document
  const config = new DocumentBuilder()
    .setTitle('Multi-Vendor SaaS API')
    .setDescription('Aggregated API documentation for all microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Initialize the document
  // eslint-disable-next-line prefer-const
  let aggregatedDocument = SwaggerModule.createDocument(app, config);

  // Fetch and merge Swagger docs from each microservice
  for (const service of microservices) {
    try {
      // Fetch the Swagger JSON from the microservice
      const response = await axios.get(
        `${service.url}/${service.docsPath}-json`
      );
      const serviceDoc = response.data;

      // Merge paths and definitions with prefix to avoid conflicts
      if (serviceDoc.paths) {
        // Add service prefix to paths to avoid collisions
        const prefixedPaths = {};
        Object.keys(serviceDoc.paths).forEach((path) => {
          const prefixedPath = `/${service.name}${path}`;
          prefixedPaths[prefixedPath] = serviceDoc.paths[path];
        });

        // Merge with aggregated document
        aggregatedDocument.paths = {
          ...aggregatedDocument.paths,
          ...prefixedPaths,
        };
      }

      // Merge schemas/components
      if (serviceDoc.components && serviceDoc.components.schemas) {
        // Add service prefix to schema names to avoid collisions
        const prefixedSchemas = {};
        Object.keys(serviceDoc.components.schemas).forEach((schema) => {
          const prefixedSchema = `${service.name}${schema}`;
          prefixedSchemas[prefixedSchema] =
            serviceDoc.components.schemas[schema];
        });

        // Initialize components if needed
        if (!aggregatedDocument.components) {
          aggregatedDocument.components = {};
        }

        // Initialize schemas if needed
        if (!aggregatedDocument.components.schemas) {
          aggregatedDocument.components.schemas = {};
        }

        // Merge with aggregated document
        aggregatedDocument.components.schemas = {
          ...aggregatedDocument.components.schemas,
          ...prefixedSchemas,
        };
      }

      console.log(`Successfully aggregated Swagger docs from ${service.name}`);
    } catch (error) {
      console.error(
        `Error fetching Swagger docs from ${service.name}: ${error.message}`
      );
    }
  }

  // Set up the aggregated Swagger UI
  SwaggerModule.setup('api/docs', app, aggregatedDocument);
}
