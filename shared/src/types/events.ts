import { CursorPosition, FileNode, Room, RoomUser, UserRole } from './room';
import { ExecutionRequest, ExecutionResult } from './execution';

// Client -> Server events
export interface ClientToServerEvents {
  'room:join': (payload: { roomId: string; userId: string; userName: string; role?: UserRole }) => void;
  'room:leave': (payload: { roomId: string; userId: string }) => void;
  'cursor:update': (payload: { roomId: string; userId: string; cursor: CursorPosition }) => void;
  'file:create': (payload: { roomId: string; name: string; language: string }) => void;
  'file:delete': (payload: { roomId: string; fileId: string }) => void;
  'file:select': (payload: { roomId: string; fileId: string }) => void;
  'execution:run': (payload: { roomId: string; fileId: string; request: ExecutionRequest }) => void;
  'interview:lock': (payload: { roomId: string; lock: boolean }) => void;
  'interview:timer:start': (payload: { roomId: string; durationMs: number }) => void;
  'version:save': (payload: { roomId: string; fileId: string; label?: string }) => void;
  'presence:ping': (payload: { roomId: string; userId: string }) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  'room:state': (room: Room) => void;
  'room:user:joined': (user: RoomUser) => void;
  'room:user:left': (userId: string) => void;
  'room:user:updated': (user: Partial<RoomUser> & { id: string }) => void;
  'cursor:update': (payload: { userId: string; cursor: CursorPosition }) => void;
  'file:created': (file: FileNode) => void;
  'file:deleted': (fileId: string) => void;
  'file:selected': (payload: { userId: string; fileId: string }) => void;
  'execution:started': (jobId: string) => void;
  'execution:result': (payload: { jobId: string; result: ExecutionResult }) => void;
  'interview:lock:changed': (locked: boolean) => void;
  'interview:timer:update': (payload: { remainingMs: number; isRunning: boolean }) => void;
  'version:saved': (versionId: string) => void;
  'presence:pong': (payload: { userId: string; timestamp: number }) => void;
  'error': (payload: { code: string; message: string }) => void;
}
