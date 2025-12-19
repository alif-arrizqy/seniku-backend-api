import { FastifyInstance } from 'fastify';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['auth'],
        description: 'Register a new user',
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            nip: { type: 'string' },
            nis: { type: 'string' },
            password: { type: 'string', minLength: 6 },
            name: { type: 'string' },
            role: { type: 'string', enum: ['TEACHER', 'STUDENT', 'ADMIN'] },
            phone: { type: 'string' },
            address: { type: 'string' },
            bio: { type: 'string' },
            birthdate: { type: 'string', format: 'date-time' },
            classId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    authController.register.bind(authController)
  );

  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        description: 'Login user',
        body: {
          type: 'object',
          properties: {
            identifier: { type: 'string', description: 'NIP for teachers, NIS for students' },
            password: { type: 'string' },
          },
          required: ['identifier', 'password'],
        },
      },
    },
    authController.login.bind(authController)
  );

  fastify.post(
    '/logout',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['auth'],
        description: 'Logout user',
        security: [{ sessionCookie: [] }],
      },
    },
    authController.logout.bind(authController)
  );

  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['auth'],
        description: 'Get current user',
        security: [{ sessionCookie: [] }],
      },
    },
    authController.getCurrentUser.bind(authController)
  );
}

