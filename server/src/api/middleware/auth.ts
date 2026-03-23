import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../../config';
import { AuthPayload } from '@collab-editor/shared';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    return;
  }
  try {
    const payload = jwt.verify(token, CONFIG.JWT.SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { next(); return; }
  try {
    req.user = jwt.verify(token, CONFIG.JWT.SECRET) as AuthPayload;
  } catch { /* ignore */ }
  next();
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, CONFIG.JWT.SECRET, { expiresIn: CONFIG.JWT.EXPIRES_IN });
}
