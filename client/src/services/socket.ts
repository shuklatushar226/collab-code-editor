import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@collab-editor/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

// In dev: connect to '/' (proxied by Vite). In prod: connect to Railway backend URL.
const SOCKET_URL = import.meta.env.VITE_API_URL ?? '/';

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false,
    }) as TypedSocket;
  }
  return socket;
}

export function connectSocket(): void {
  getSocket().connect();
}

export function disconnectSocket(): void {
  getSocket().disconnect();
  socket = null;
}
