import Redis from 'ioredis';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

// Support both REDIS_URL (Upstash / cloud) and individual host/port (local/Docker)
const REDIS_URL = process.env.REDIS_URL;

function makeClient(): Redis {
  if (REDIS_URL) {
    return new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false, // Upstash doesn't support CLIENT SETNAME
      tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });
  }
  return new Redis({
    host: CONFIG.REDIS.HOST,
    port: CONFIG.REDIS.PORT,
    password: CONFIG.REDIS.PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  });
}

export const redis = makeClient();
export const redisSub = makeClient(); // Dedicated subscriber client
export const redisPub = makeClient(); // Dedicated publisher client

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));

export async function checkRedisConnection(): Promise<void> {
  await redis.ping();
  logger.info('Redis ping successful');
}

// Typed helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  if (!val) return null;
  try { return JSON.parse(val) as T; } catch { return null; }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

export async function cacheExpire(key: string, ttlSeconds: number): Promise<void> {
  await redis.expire(key, ttlSeconds);
}
