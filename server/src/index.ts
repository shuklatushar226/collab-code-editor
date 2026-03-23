import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createApp } from './api';
import { setupWebSockets } from './websocket';
import { checkDbConnection, pool } from './db/pool';
import { checkRedisConnection } from './cache/redis';
import { CONFIG } from './config';
import { logger } from './utils/logger';

async function runMigrations(): Promise<void> {
  const migrationPath = path.join(__dirname, 'db', 'migrations', '001_init.sql');
  if (!fs.existsSync(migrationPath)) {
    logger.warn('Migration file not found, skipping auto-migration');
    return;
  }
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    logger.info('Database migrations applied successfully');
  } catch (err: any) {
    // IF EXISTS guards in the SQL make this idempotent — log but don't crash
    if (err.code !== '42P07') logger.warn('Migration warning:', err.message);
  } finally {
    client.release();
  }
}

async function bootstrap(): Promise<void> {
  // Health checks + auto-migrate
  await checkDbConnection();
  await runMigrations();
  await checkRedisConnection();

  const app = createApp();
  const httpServer = http.createServer(app);
  setupWebSockets(httpServer);

  httpServer.listen(CONFIG.PORT, () => {
    logger.info(`Server running on port ${CONFIG.PORT} [${CONFIG.NODE_ENV}]`);
    logger.info(`WebSocket (Socket.IO + Yjs) on same port`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
