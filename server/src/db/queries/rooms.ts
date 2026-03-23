import { PoolClient } from 'pg';
import { pool } from '../pool';

export interface DBRoom {
  id: string;
  name: string;
  created_by: string;
  is_interview_mode: boolean;
  interviewer_id: string | null;
  candidate_id: string | null;
  is_locked: boolean;
  active_file_id: string | null;
  interview_question: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DBFile {
  id: string;
  room_id: string;
  name: string;
  language: string;
  content: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export async function createRoom(
  id: string,
  name: string,
  createdBy: string,
  client?: PoolClient
): Promise<DBRoom> {
  const db = client ?? pool;
  const result = await db.query<DBRoom>(
    `INSERT INTO rooms (id, name, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [id, name, createdBy]
  );
  return result.rows[0];
}

export async function getRoomById(id: string): Promise<DBRoom | null> {
  const result = await pool.query<DBRoom>(
    `SELECT * FROM rooms WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function updateRoom(
  id: string,
  updates: Partial<{ is_locked: boolean; active_file_id: string; interview_question: string; is_interview_mode: boolean }>
): Promise<DBRoom | null> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;
  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(updates)];
  const result = await pool.query<DBRoom>(
    `UPDATE rooms SET ${setClauses} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function createFile(
  id: string,
  roomId: string,
  name: string,
  language: string,
  createdBy: string
): Promise<DBFile> {
  const result = await pool.query<DBFile>(
    `INSERT INTO files (id, room_id, name, language, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, roomId, name, language, createdBy]
  );
  return result.rows[0];
}

export async function getFilesByRoomId(roomId: string): Promise<DBFile[]> {
  const result = await pool.query<DBFile>(
    `SELECT * FROM files WHERE room_id = $1 ORDER BY created_at ASC`,
    [roomId]
  );
  return result.rows;
}

export async function updateFileContent(fileId: string, content: string): Promise<void> {
  await pool.query(
    `UPDATE files SET content = $1, updated_at = NOW() WHERE id = $2`,
    [content, fileId]
  );
}

export async function deleteFile(fileId: string, roomId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM files WHERE id = $1 AND room_id = $2`,
    [fileId, roomId]
  );
  return (result.rowCount ?? 0) > 0;
}
