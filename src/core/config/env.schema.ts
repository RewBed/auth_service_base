import { z } from 'zod';

export const envSchema = z.object({
  SERVICE_NAME: z.string(),
  SERVICE_PORT: z.preprocess((val) => Number(val), z.number()),
  GRPC_PORT: z.preprocess((val) => Number(val), z.number()),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.preprocess((val) => Number(val), z.number()),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),

  JWT_ACCESS_SECRET: z.string().default('change_me_access_secret'),
  JWT_REFRESH_SECRET: z.string().default('change_me_refresh_secret'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
});

export type EnvConfig = z.infer<typeof envSchema>;
