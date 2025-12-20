import { z } from 'zod';

export const createAchievementSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  icon: z
    .string()
    .min(1, 'Icon is required')
    .max(10, 'Icon must be a single emoji or less than 10 characters')
    .refine(
      (val) => {
        return val.length <= 10;
      },
      { message: 'Icon must be a valid emoji or short string' }
    ),
  criteria: z.any().optional(), // JSON object for achievement criteria
});

export const updateAchievementSchema = z.object({
  name: z.string().min(1).max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  icon: z
    .string()
    .max(10, 'Icon must be a single emoji or less than 10 characters')
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return val.length <= 10;
      },
      { message: 'Icon must be a valid emoji or short string' }
    ),
  criteria: z.any().optional(), // JSON object for achievement criteria
});

export const queryAchievementsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default(() => 1),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default(() => 10),
  search: z.string().optional(),
});

