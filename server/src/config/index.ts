import { config } from 'dotenv';
config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT ?? '3001'),
  WS_PORT: parseInt(process.env.WS_PORT ?? '3002'),
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  DB: {
    HOST: process.env.DB_HOST ?? 'localhost',
    PORT: parseInt(process.env.DB_PORT ?? '5432'),
    NAME: process.env.DB_NAME ?? 'collab_editor',
    USER: process.env.DB_USER ?? 'postgres',
    PASSWORD: process.env.DB_PASSWORD ?? 'postgres',
    POOL_MAX: parseInt(process.env.DB_POOL_MAX ?? '20'),
  },

  REDIS: {
    HOST: process.env.REDIS_HOST ?? 'localhost',
    PORT: parseInt(process.env.REDIS_PORT ?? '6379'),
    PASSWORD: process.env.REDIS_PASSWORD ?? undefined,
    TTL: parseInt(process.env.REDIS_TTL ?? '86400'), // 24h
  },

  JWT: {
    // JWT_SECRET must be set via environment variable — no hardcoded default in code
    SECRET: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET env var is required'); })(),
    EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  EXECUTOR: {
    URL: process.env.EXECUTOR_URL ?? 'http://localhost:3003',
    TIMEOUT_MS: parseInt(process.env.EXECUTOR_TIMEOUT_MS ?? '30000'),
  },

  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
  },

  CORS: {
    ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  },

  VERSION_HISTORY: {
    MAX_PER_FILE: parseInt(process.env.MAX_VERSIONS_PER_FILE ?? '50'),
    AUTO_SAVE_INTERVAL_MS: parseInt(process.env.AUTO_SAVE_INTERVAL_MS ?? '30000'),
  },
} as const;
