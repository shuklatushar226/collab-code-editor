import { useEffect, useCallback, useRef } from 'react';
import { useRoomStore } from '../store/roomStore';
import { useUserStore } from '../store/userStore';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';
import { roomApi } from '../services/api';
import { FileNode } from '@collab-editor/shared';
import toast from 'react-hot-toast';

export function useRoom(roomId: string) {
  const store = useRoomStore();
  const { user } = useUserStore();
  const socket = getSocket();
  const pingInterval = useRef<NodeJS.Timeout>();

  const initRoom = useCallback(async () => {
    if (!user || !roomId) return;

    try {
      const { data } = await roomApi.get(roomId);
      const files: FileNode[] = data.files.map((f: any) => ({
        id: f.id,
        name: f.name,
        language: f.language,
        content: f.content ?? '',
        createdAt: new Date(f.created_at).getTime(),
        updatedAt: new Date(f.updated_at).getTime(),
        isActive: false,
      }));
      store.setFiles(files);
      if (files.length > 0) store.setActiveFile(files[0].id);
    } catch {
      toast.error('Failed to load room data');
    }
  }, [roomId, user]);

  useEffect(() => {
    if (!user || !roomId) return;

    connectSocket();

    socket.on('connect', () => {
      store.setConnected(true);
      socket.emit('room:join', {
        roomId,
        userId: user.id,
        userName: user.name,
        role: 'editor',
      });
    });

    socket.on('disconnect', () => {
      store.setConnected(false);
      toast.error('Disconnected from server');
    });

    socket.on('room:state', (room) => {
      store.setRoom(room as any);
      store.setUsers(room.users);
    });

    socket.on('room:user:joined', (u) => {
      store.addUser(u);
      toast.success(`${u.name} joined`);
    });

    socket.on('room:user:left', (userId) => {
      const user = store.users.get(userId);
      if (user) toast(`${user.name} left`);
      store.removeUser(userId);
      store.removeCursor(userId);
    });

    socket.on('cursor:update', ({ userId, cursor }) => {
      store.setCursor(userId, cursor);
    });

    socket.on('file:created', (file) => {
      store.addFile(file as FileNode);
    });

    socket.on('file:deleted', (fileId) => {
      store.removeFile(fileId);
    });

    socket.on('interview:lock:changed', (locked) => {
      store.setLocked(locked);
      toast(locked ? 'Editor locked by interviewer' : 'Editor unlocked');
    });

    socket.on('execution:result', ({ result }) => {
      store.setExecuting(false);
      store.setExecutionOutput(
        `Exit: ${result.exitCode} | Time: ${result.executionTimeMs}ms\n\n` +
        (result.stdout || '') +
        (result.stderr ? `\nSTDERR:\n${result.stderr}` : '')
      );
    });

    socket.on('error', ({ message }) => toast.error(message));

    initRoom();

    // Heartbeat
    pingInterval.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('presence:ping', { roomId, userId: user.id });
      }
    }, 30_000);

    return () => {
      socket.emit('room:leave', { roomId, userId: user.id });
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:state');
      socket.off('room:user:joined');
      socket.off('room:user:left');
      socket.off('cursor:update');
      socket.off('file:created');
      socket.off('file:deleted');
      socket.off('interview:lock:changed');
      socket.off('execution:result');
      socket.off('error');
      clearInterval(pingInterval.current);
      disconnectSocket();
      store.reset();
    };
  }, [roomId, user?.id]);

  return store;
}
