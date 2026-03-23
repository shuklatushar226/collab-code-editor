import * as fs from 'fs';
import * as path from 'path';
import { pool } from './pool';
import { logger } from '../utils/logger';

async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    const migrationPath = path.join(__dirname, 'migrations', '001_init.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    await client.query(sql);
    logger.info('Database migrations completed successfully');
  } catch (err) {
    logger.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(process.exit.bind(process, 1));
