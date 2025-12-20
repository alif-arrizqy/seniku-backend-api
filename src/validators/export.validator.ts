import { z } from 'zod';
import { SubmissionStatus } from '@prisma/client';

export const exportGradesSchema = z.object({
  classIds: z.array(z.string().uuid()).optional(),
  assignmentIds: z.array(z.string().uuid()).optional(),
  studentIds: z.array(z.string().uuid()).optional(),
  statuses: z.array(z.nativeEnum(SubmissionStatus)).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const exportGradesPdfSchema = exportGradesSchema.extend({
  format: z.enum(['summary', 'detailed']).optional().default('detailed'),
});

export const exportReportCardSchema = z.object({
  format: z.enum(['summary', 'detailed']).optional().default('detailed'),
});

