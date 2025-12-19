import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // Server
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('6000'),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Session
  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.string().transform(Number).pipe(z.number().int().positive()).default('604800000'),

  // MinIO
  MINIO_ENDPOINT: z.string().default('127.0.0.1'),
  MINIO_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('9000'),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_USE_SSL: z.string().transform((val) => val === 'true').default('false'),
  MINIO_BUCKET_AVATARS: z.string().default('avatars'),
  MINIO_BUCKET_SUBMISSIONS: z.string().default('submissions'),
  MINIO_BUCKET_TEMP: z.string().default('temp'),
  MINIO_PUBLIC_URL: z.string().url().default('http://127.0.0.1:9000'),

  // CORS
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  RATE_LIMIT_TIME_WINDOW: z.string().transform(Number).pipe(z.number().int().positive()).default('60000'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export default env;

