import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import versionsRoutes from './routes/versions';
import executionRoutes from './routes/execution';
import { CONFIG } from '../config';

export function createApp(): express.Application {
  const app = express();

  // Security
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: CONFIG.CORS.ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));

  // Compression + body parsing
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use('/api/', apiLimiter);

  // Health check
  app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/rooms', versionsRoutes);
  app.use('/api', executionRoutes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
