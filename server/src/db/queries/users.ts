import { pool } from '../pool';
import bcrypt from 'bcryptjs';

export interface DBUser {
  id: string;
  name: string;
  email: string | null;
  password_hash: string | null;
  is_guest: boolean;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(
  id: string,
  name: string,
  email?: string,
  password?: string,
  isGuest = false
): Promise<DBUser> {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const result = await pool.query<DBUser>(
    `INSERT INTO users (id, name, email, password_hash, is_guest)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, name, email ?? null, passwordHash, isGuest]
  );
  return result.rows[0];
}

export async function getUserById(id: string): Promise<DBUser | null> {
  const result = await pool.query<DBUser>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<DBUser | null> {
  const result = await pool.query<DBUser>(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function verifyPassword(user: DBUser, password: string): Promise<boolean> {
  if (!user.password_hash) return false;
  return bcrypt.compare(password, user.password_hash);
}
