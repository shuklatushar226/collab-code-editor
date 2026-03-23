import { Pool, PoolClient } from 'pg';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(!process.env.DATABASE_URL && {
    host: CONFIG.DB.HOST,
    port: CONFIG.DB.PORT,
    database: CONFIG.DB.NAME,
    user: CONFIG.DB.USER,
    password: CONFIG.DB.PASSWORD,
  }),
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  max: CONFIG.DB.POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function checkDbConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.info('PostgreSQL connected successfully');
  } finally {
    client.release();
  }
}
