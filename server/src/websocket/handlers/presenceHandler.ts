import { Server, Socket } from 'socket.io';
import { updateUserInRoom } from '../../cache/roomCache';

export function registerPresenceHandlers(io: Server, socket: Socket): void {
  socket.on('presence:ping', async (payload: { roomId: string; userId: string }) => {
    const { roomId, userId } = payload;
    await updateUserInRoom(roomId, userId, { lastSeen: Date.now(), isOnline: true });
    socket.emit('presence:pong', { userId, timestamp: Date.now() });
  });
}
