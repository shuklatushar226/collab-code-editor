import rateLimit from 'express-rate-limit';
import { CONFIG } from '../../config';

export const apiLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
});

export const executionLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Execution rate limit exceeded', code: 'EXECUTION_RATE_LIMITED' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts', code: 'AUTH_RATE_LIMITED' },
});
