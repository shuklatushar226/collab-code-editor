import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { generateRoomId, isValidRoomId, generateFileId, getLanguageFromFilename } from '@collab-editor/shared';
import { createRoom, getRoomById, createFile, getFilesByRoomId } from '../../db/queries/rooms';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const CreateRoomSchema = z.object({
  name: z.string().min(1).max(128).default('Untitled Room'),
  isInterviewMode: z.boolean().default(false),
});

// Create room
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, isInterviewMode } = CreateRoomSchema.parse(req.body);
    const roomId = generateRoomId();
    const room = await createRoom(roomId, name, req.user!.userId);

    // Create default file
    const fileId = generateFileId();
    await createFile(fileId, roomId, 'main.js', 'javascript', req.user!.userId);

    res.status(201).json({ roomId: room.id, name: room.name });
  } catch (err) { next(err); }
});

// Get room info
router.get('/:roomId', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!isValidRoomId(roomId)) throw new AppError('Invalid room ID', 400, 'INVALID_ROOM_ID');

    const room = await getRoomById(roomId);
    if (!room) throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');

    const files = await getFilesByRoomId(roomId);
    res.json({ room, files });
  } catch (err) { next(err); }
});

// Create file in room
router.post('/:roomId/files', requireAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { name } = z.object({ name: z.string().min(1).max(255) }).parse(req.body);

    if (!isValidRoomId(roomId)) throw new AppError('Invalid room ID', 400, 'INVALID_ROOM_ID');
    const room = await getRoomById(roomId);
    if (!room) throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');

    const fileId = generateFileId();
    const language = getLanguageFromFilename(name);
    const file = await createFile(fileId, roomId, name, language, req.user!.userId);

    res.status(201).json(file);
  } catch (err) { next(err); }
});

export default router;
