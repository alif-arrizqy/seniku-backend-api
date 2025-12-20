import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  icon: z
    .string()
    .max(10, 'Icon must be a single emoji or less than 10 characters')
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        // Allow emoji and basic characters, but limit length
        // Emoji can be 1-4 bytes per character, so we check the string length
        return val.length <= 10;
      },
      { message: 'Icon must be a valid emoji or short string' }
    ),
});

export const updateCategorySchema = z.object({
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
  isActive: z.boolean().optional(),
});

export const queryCategoriesSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
});

