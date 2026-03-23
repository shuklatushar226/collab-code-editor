import { Server, Socket } from 'socket.io';
import { updateRoom } from '../../db/queries/rooms';
import { logger } from '../../utils/logger';

interface TimerState {
  startedAt: number;
  durationMs: number;
  interval: NodeJS.Timeout;
}

const roomTimers = new Map<string, TimerState>();

export function registerInterviewHandlers(io: Server, socket: Socket): void {
  socket.on('interview:lock', async (payload: { roomId: string; lock: boolean }) => {
    try {
      const { roomId, lock } = payload;
      await updateRoom(roomId, { is_locked: lock });
      io.to(roomId).emit('interview:lock:changed', lock);
    } catch (err) {
      logger.error('interview:lock error:', err);
    }
  });

  socket.on('interview:timer:start', (payload: { roomId: string; durationMs: number }) => {
    const { roomId, durationMs } = payload;

    // Clear existing timer
    const existing = roomTimers.get(roomId);
    if (existing) clearInterval(existing.interval);

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, durationMs - elapsed);

      io.to(roomId).emit('interview:timer:update', { remainingMs, isRunning: remainingMs > 0 });

      if (remainingMs <= 0) {
        clearInterval(interval);
        roomTimers.delete(roomId);
      }
    }, 1000);

    roomTimers.set(roomId, { startedAt, durationMs, interval });
    io.to(roomId).emit('interview:timer:update', { remainingMs: durationMs, isRunning: true });
  });
}
