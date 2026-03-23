import { Server, Socket } from 'socket.io';
import {
  addUserToRoom, removeUserFromRoom, getRoomUsers, updateUserInRoom
} from '../../cache/roomCache';
import { getRoomById } from '../../db/queries/rooms';
import { hashStringToColor, RoomUser, UserRole, generateUserId } from '@collab-editor/shared';
import { logger } from '../../utils/logger';

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on('room:join', async (payload: { roomId: string; userId: string; userName: string; role?: UserRole }) => {
    try {
      const { roomId, userId, userName, role = 'editor' } = payload;

      const room = await getRoomById(roomId);
      if (!room) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        return;
      }

      const user: RoomUser = {
        id: userId,
        name: userName,
        color: hashStringToColor(userId),
        role,
        isOnline: true,
        lastSeen: Date.now(),
      };

      await addUserToRoom(roomId, user);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;

      // Get all users in room
      const users = await getRoomUsers(roomId);

      // Send room state to joining user
      socket.emit('room:state', {
        id: room.id,
        name: room.name,
        createdBy: room.created_by,
        createdAt: new Date(room.created_at).getTime(),
        isInterviewMode: room.is_interview_mode,
        isLocked: room.is_locked,
        activeFileId: room.active_file_id ?? '',
        users,
      });

      // Notify others
      socket.to(roomId).emit('room:user:joined', user);
      logger.debug(`User ${userName} joined room ${roomId}`);
    } catch (err) {
      logger.error('room:join error:', err);
      socket.emit('error', { code: 'JOIN_FAILED', message: 'Failed to join room' });
    }
  });

  socket.on('room:leave', async (payload: { roomId: string; userId: string }) => {
    await handleLeave(io, socket, payload.roomId, payload.userId);
  });

  socket.on('disconnect', async () => {
    const { roomId, userId } = socket.data;
    if (roomId && userId) {
      await handleLeave(io, socket, roomId, userId);
    }
  });
}

async function handleLeave(io: Server, socket: Socket, roomId: string, userId: string): Promise<void> {
  try {
    await removeUserFromRoom(roomId, userId);
    socket.leave(roomId);
    io.to(roomId).emit('room:user:left', userId);
    logger.debug(`User ${userId} left room ${roomId}`);
  } catch (err) {
    logger.error('room:leave error:', err);
  }
}
