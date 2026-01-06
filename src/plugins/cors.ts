import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import env from '../config/env';

export default async function corsPlugin(fastify: FastifyInstance) {
  // Get allowed origins from environment or use default
  const defaultOrigins = [
    'http://localhost:8009',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:8009',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  const allowedOrigins = env.CORS_ORIGIN
    ? [
        ...env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
        ...defaultOrigins, // Always include localhost for development
      ]
    : defaultOrigins;

  // Remove duplicates
  const uniqueOrigins = [...new Set(allowedOrigins)];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return cb(null, true);
      }

      // In development, allow all origins
      if (env.NODE_ENV === 'development') {
        return cb(null, true);
      }

      // Check if origin is in allowed list
      const isAllowed = uniqueOrigins.includes(origin);
      
      // Also allow localhost patterns for flexibility
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed || isLocalhost) {
        return cb(null, true);
      }

      // Log rejected origin for debugging
      console.warn(`⚠️  CORS: Rejected origin: ${origin}`);
      console.warn(`✅ CORS: Allowed origins: ${uniqueOrigins.join(', ')}`);

      // Reject origin
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Content-Length',
    ],
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'Authorization',
    ],
    maxAge: 86400, // 24 hours - cache preflight requests
    preflight: true, // Enable preflight requests
    preflightContinue: false, // Don't continue after preflight
  });

  // Log CORS configuration on startup
  console.log('🌐 CORS configured:');
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Allowed origins: ${uniqueOrigins.join(', ')}`);
  console.log(`   Development mode: ${env.NODE_ENV === 'development' ? 'ALLOW ALL' : 'RESTRICTED'}`);
}

