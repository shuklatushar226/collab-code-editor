import { pool } from '../pool';

export interface DBVersion {
  id: string;
  room_id: string;
  file_id: string;
  content: string;
  created_by: string;
  label: string | null;
  description: string | null;
  created_at: Date;
}

export async function saveVersion(
  roomId: string,
  fileId: string,
  content: string,
  createdBy: string,
  label?: string,
  description?: string
): Promise<DBVersion> {
  const result = await pool.query<DBVersion>(
    `INSERT INTO versions (room_id, file_id, content, created_by, label, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [roomId, fileId, content, createdBy, label ?? null, description ?? null]
  );

  // Enforce max versions limit (keep latest 50)
  await pool.query(
    `DELETE FROM versions WHERE file_id = $1 AND id NOT IN (
      SELECT id FROM versions WHERE file_id = $1 ORDER BY created_at DESC LIMIT 50
    )`,
    [fileId]
  );

  return result.rows[0];
}

export async function getVersionsByFileId(fileId: string, limit = 20): Promise<DBVersion[]> {
  const result = await pool.query<DBVersion>(
    `SELECT v.*, u.name as creator_name
     FROM versions v
     LEFT JOIN users u ON v.created_by = u.id::text
     WHERE v.file_id = $1
     ORDER BY v.created_at DESC
     LIMIT $2`,
    [fileId, limit]
  );
  return result.rows;
}

export async function getVersionById(versionId: string): Promise<DBVersion | null> {
  const result = await pool.query<DBVersion>(
    `SELECT * FROM versions WHERE id = $1`,
    [versionId]
  );
  return result.rows[0] ?? null;
}
