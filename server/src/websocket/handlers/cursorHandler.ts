import { Server, Socket } from 'socket.io';
import { CursorPosition } from '@collab-editor/shared';
import { updateUserInRoom } from '../../cache/roomCache';

export function registerCursorHandlers(io: Server, socket: Socket): void {
  socket.on('cursor:update', async (payload: { roomId: string; userId: string; cursor: CursorPosition }) => {
    const { roomId, userId, cursor } = payload;

    // Update cursor in cache
    await updateUserInRoom(roomId, userId, { cursor });

    // Broadcast to other users in the room (not the sender)
    socket.to(roomId).emit('cursor:update', { userId, cursor });
  });
}
