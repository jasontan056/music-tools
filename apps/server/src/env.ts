import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  WEB_URL: z.string().url().default('http://localhost:5173')
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  WEB_URL: process.env.WEB_URL
});

export const serverConfig = {
  port: Number(env.PORT ?? 4000),
  webUrl: env.WEB_URL
};
