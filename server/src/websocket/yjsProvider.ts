import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import * as lib0 from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { IncomingMessage } from 'http';
import WebSocket from 'ws';
import { redis, redisPub, redisSub } from '../cache/redis';
import { storeYjsState, getYjsState } from '../cache/roomCache';
import { updateFileContent } from '../db/queries/rooms';
import { logger } from '../utils/logger';

const CHANNEL_PREFIX = 'yjs:';
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

interface DocRoom {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  clients: Map<WebSocket, { userId: string; fileId: string }>;
  persistTimeout?: NodeJS.Timeout;
}

const docRooms = new Map<string, DocRoom>(); // key: `${roomId}:${fileId}`

function getRoomKey(roomId: string, fileId: string): string {
  return `${roomId}:${fileId}`;
}

async function getOrCreateDocRoom(roomId: string, fileId: string): Promise<DocRoom> {
  const key = getRoomKey(roomId, fileId);

  if (docRooms.has(key)) return docRooms.get(key)!;

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);

  // Load persisted state from Redis
  const persistedState = await getYjsState(roomId, fileId);
  if (persistedState) {
    try {
      Y.applyUpdate(doc, persistedState);
    } catch (err) {
      logger.warn(`Failed to apply persisted Yjs state for ${key}:`, err);
    }
  }

  const room: DocRoom = { doc, awareness, clients: new Map() };
  docRooms.set(key, room);

  // Subscribe to Redis pub/sub for horizontal scaling
  const channel = `${CHANNEL_PREFIX}${key}`;
  await redisSub.subscribe(channel);

  redisSub.on('messageBuffer', (chan: Buffer, message: Buffer) => {
    if (chan.toString() !== channel) return;
    // Broadcast to all local WebSocket clients
    room.clients.forEach((_, ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    });
  });

  // Auto-persist on doc changes
  doc.on('update', () => schedulePersist(roomId, fileId, room));

  return room;
}

function schedulePersist(roomId: string, fileId: string, room: DocRoom): void {
  if (room.persistTimeout) clearTimeout(room.persistTimeout);
  room.persistTimeout = setTimeout(() => persistDoc(roomId, fileId, room), 5000);
}

async function persistDoc(roomId: string, fileId: string, room: DocRoom): Promise<void> {
  try {
    const state = Y.encodeStateAsUpdate(room.doc);
    await storeYjsState(roomId, fileId, Buffer.from(state));

    // Also persist to PostgreSQL
    const text = room.doc.getText('content');
    await updateFileContent(fileId, text.toString());
  } catch (err) {
    logger.error(`Failed to persist Yjs doc ${roomId}:${fileId}:`, err);
  }
}

export async function handleYjsConnection(
  ws: WebSocket,
  req: IncomingMessage,
  roomId: string,
  fileId: string,
  userId: string
): Promise<void> {
  const room = await getOrCreateDocRoom(roomId, fileId);
  room.clients.set(ws, { userId, fileId });

  // Send current document state to new client
  const encoder = lib0.createEncoder();
  lib0.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(encoder, room.doc);
  ws.send(lib0.toUint8Array(encoder));

  // Send awareness state
  const awarenessEncoder = lib0.createEncoder();
  lib0.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
  awarenessProtocol.encodeAwarenessUpdate(
    room.awareness,
    Array.from(room.awareness.getStates().keys()),
    awarenessEncoder
  );
  ws.send(lib0.toUint8Array(awarenessEncoder));

  ws.on('message', async (data: Buffer) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const msgType = decoding.readVarUint(decoder);
    const channel = `${CHANNEL_PREFIX}${getRoomKey(roomId, fileId)}`;

    if (msgType === MESSAGE_SYNC) {
      const encoder = lib0.createEncoder();
      lib0.writeVarUint(encoder, MESSAGE_SYNC);
      const syncMsgType = syncProtocol.readSyncMessage(decoder, encoder, room.doc, null);
      if (syncMsgType === syncProtocol.messageYjsSyncStep2 || syncMsgType === syncProtocol.messageYjsUpdate) {
        const update = lib0.toUint8Array(encoder);
        // Publish to Redis for other server instances
        await redisPub.publishBuffer(channel, Buffer.from(data));
        // Broadcast to local clients
        room.clients.forEach((_, client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(update);
          }
        });
      } else if (lib0.length(encoder) > 1) {
        ws.send(lib0.toUint8Array(encoder));
      }
    } else if (msgType === MESSAGE_AWARENESS) {
      awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(decoder), ws);
      await redisPub.publishBuffer(channel, Buffer.from(data));
      room.clients.forEach((_, client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) client.send(data);
      });
    }
  });

  ws.on('close', () => {
    room.clients.delete(ws);
    awarenessProtocol.removeAwarenessStates(room.awareness, [room.doc.clientID], null);

    if (room.clients.size === 0) {
      // Final persist when room is empty
      persistDoc(roomId, fileId, room);
      if (room.persistTimeout) clearTimeout(room.persistTimeout);
    }
  });
}
