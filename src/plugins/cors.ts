import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

export default async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });
}

