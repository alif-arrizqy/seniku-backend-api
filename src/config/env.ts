import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // Server
  PORT: z.string().default('8989').transform(Number).pipe(z.number().int().positive()),
  HOST: z.string().default('localhost'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // File Upload
  MAX_FILE_SIZE: z.string().default('5242880').transform(Number).pipe(z.number().int().positive()),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Image Processing
  IMAGE_MAX_WIDTH: z.string().default('2400').transform(Number).pipe(z.number().int().positive()),
  IMAGE_MAX_HEIGHT: z.string().default('1600').transform(Number).pipe(z.number().int().positive()),
  IMAGE_THUMBNAIL_SIZE: z.string().default('300').transform(Number).pipe(z.number().int().positive()),
  IMAGE_MEDIUM_SIZE: z.string().default('800').transform(Number).pipe(z.number().int().positive()),
  IMAGE_QUALITY: z.string().default('90').transform(Number).pipe(z.number().int().min(1).max(100)),

  // MinIO
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.string().default('9000').transform(Number).pipe(z.number().int().positive()),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_USE_SSL: z.string().default('false').transform((val) => val === 'true'),
  MINIO_BUCKET_AVATARS: z.string().default('avatars'),
  MINIO_BUCKET_SUBMISSIONS: z.string().default('submissions'),
  MINIO_BUCKET_TEMP: z.string().default('temp'),
  MINIO_PUBLIC_URL: z.string().url().default('http://localhost:9000'),

  // CORS
  CORS_ORIGIN: z.string().url().default('http://localhost:8080'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().default('100').transform(Number).pipe(z.number().int().positive()),
  RATE_LIMIT_TIME_WINDOW: z.string().default('60000').transform(Number).pipe(z.number().int().positive()),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error: any) {
  if (error instanceof z.ZodError && error.issues) {
    console.error('❌ Invalid environment variables:');
    error.issues.forEach((issue: any) => {
      const path = issue.path ? issue.path.join('.') : 'unknown';
      const message = issue.message || 'Validation error';
      console.error(`  - ${path}: ${message}`);
    });
    process.exit(1);
  } else {
    console.error('❌ Error loading environment variables:', error?.message || error);
    process.exit(1);
  }
}

export default env;

