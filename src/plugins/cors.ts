import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import env from '../config/env';

export default async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

