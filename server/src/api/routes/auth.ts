import { Router } from 'express';
import { z } from 'zod';
import { createUser, getUserByEmail, verifyPassword } from '../../db/queries/users';
import { signToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { sanitizeUserName } from '@collab-editor/shared';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(1).max(64),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const GuestSchema = z.object({
  name: z.string().min(1).max(64),
});

// Register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = RegisterSchema.parse(req.body);
    const sanitizedName = sanitizeUserName(name);

    if (email) {
      const existing = await getUserByEmail(email);
      if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const id = randomUUID();
    const user = await createUser(id, sanitizedName, email, password);
    const token = signToken({ userId: user.id, name: user.name, email: user.email ?? undefined });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

// Login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = await getUserByEmail(email);
    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const valid = await verifyPassword(user, password);
    if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const token = signToken({ userId: user.id, name: user.name, email: user.email ?? undefined });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

// Guest login (no password, just a display name)
router.post('/guest', authLimiter, async (req, res, next) => {
  try {
    const { name } = GuestSchema.parse(req.body);
    const sanitizedName = sanitizeUserName(name);
    const id = randomUUID();
    const user = await createUser(id, sanitizedName, undefined, undefined, true);
    const token = signToken({ userId: user.id, name: user.name });
    res.status(201).json({ token, user: { id: user.id, name: user.name, isGuest: true } });
  } catch (err) { next(err); }
});

export default router;
