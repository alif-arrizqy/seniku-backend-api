import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import env from '../config/env';

export default async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Seniku Backend API',
        description: 'Backend API for Seniku - E-Portfolio Seni Digital',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management endpoints' },
        { name: 'classes', description: 'Class management endpoints' },
        { name: 'assignments', description: 'Assignment management endpoints' },
        { name: 'submissions', description: 'Submission management endpoints' },
        { name: 'students', description: 'Student management endpoints' },
        { name: 'portfolio', description: 'Portfolio endpoints' },
        { name: 'categories', description: 'Category management endpoints' },
        { name: 'notifications', description: 'Notification endpoints' },
        { name: 'export', description: 'Export endpoints' },
      ],
      components: {
        securitySchemes: {
          sessionCookie: {
            type: 'apiKey',
            in: 'cookie',
            name: 'sessionId',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
}

