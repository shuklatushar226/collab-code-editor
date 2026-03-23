import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { CONFIG } from '../config';
import { registerRoomHandlers } from './handlers/roomHandler';
import { registerCursorHandlers } from './handlers/cursorHandler';
import { registerPresenceHandlers } from './handlers/presenceHandler';
import { registerInterviewHandlers } from './handlers/interviewHandler';
import { handleYjsConnection } from './yjsProvider';
import { logger } from '../utils/logger';

export function setupWebSockets(httpServer: HTTPServer): { io: SocketServer; wss: WebSocketServer } {
  // Socket.IO for presence, cursors, room events
  const io = new SocketServer(httpServer, {
    cors: {
      origin: CONFIG.CORS.ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);
    registerRoomHandlers(io, socket);
    registerCursorHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerInterviewHandlers(io, socket);
  });

  // WebSocket server for Yjs CRDT sync (mounted on /yjs path)
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: IncomingMessage, socket: any, head: any) => {
    const url = request.url ?? '';

    if (url.startsWith('/yjs')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (ws, request) => {
    // URL format: /yjs?roomId=XXXX-XXXX&fileId=abc123&userId=xyz
    const url = new URL(request.url ?? '', 'http://localhost');
    const roomId = url.searchParams.get('roomId');
    const fileId = url.searchParams.get('fileId');
    const userId = url.searchParams.get('userId');

    if (!roomId || !fileId || !userId) {
      ws.close(1008, 'Missing parameters');
      return;
    }

    logger.debug(`Yjs connection: room=${roomId} file=${fileId} user=${userId}`);
    await handleYjsConnection(ws, request, roomId, fileId, userId);
  });

  return { io, wss };
}
