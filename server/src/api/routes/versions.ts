import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { saveVersion, getVersionsByFileId, getVersionById } from '../../db/queries/versions';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const SaveVersionSchema = z.object({
  fileId: z.string().min(1),
  content: z.string(),
  label: z.string().max(128).optional(),
  description: z.string().max(500).optional(),
});

// Save version
router.post('/:roomId/versions', requireAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { fileId, content, label, description } = SaveVersionSchema.parse(req.body);
    const version = await saveVersion(roomId, fileId, content, req.user!.userId, label, description);
    res.status(201).json(version);
  } catch (err) { next(err); }
});

// Get versions for a file
router.get('/:roomId/files/:fileId/versions', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const limit = parseInt(req.query.limit as string ?? '20');
    const versions = await getVersionsByFileId(fileId, limit);
    res.json(versions);
  } catch (err) { next(err); }
});

// Get specific version
router.get('/versions/:versionId', async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const version = await getVersionById(versionId);
    if (!version) throw new AppError('Version not found', 404, 'VERSION_NOT_FOUND');
    res.json(version);
  } catch (err) { next(err); }
});

export default router;
