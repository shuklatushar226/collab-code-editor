import 'dotenv/config';
import http from 'http';
import { createApp } from './api';
import { setupWebSockets } from './websocket';
import { checkDbConnection } from './db/pool';
import { checkRedisConnection } from './cache/redis';
import { CONFIG } from './config';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  // Health checks
  await checkDbConnection();
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
