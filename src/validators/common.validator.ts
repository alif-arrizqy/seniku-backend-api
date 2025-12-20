import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default(() => 1),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default(() => 10),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const dateSchema = z.string().datetime().or(z.date());

