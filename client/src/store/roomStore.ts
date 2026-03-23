import { create } from 'zustand';
import { FileNode, Room, RoomUser, CursorPosition } from '@collab-editor/shared';

interface RoomState {
  room: Room | null;
  files: FileNode[];
  activeFileId: string | null;
  users: Map<string, RoomUser>;
  cursors: Map<string, CursorPosition>;
  isConnected: boolean;
  isExecuting: boolean;
  executionOutput: string | null;
  isLocked: boolean;

  setRoom: (room: Room) => void;
  setFiles: (files: FileNode[]) => void;
  addFile: (file: FileNode) => void;
  removeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  setUsers: (users: RoomUser[]) => void;
  addUser: (user: RoomUser) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<RoomUser>) => void;
  setCursor: (userId: string, cursor: CursorPosition) => void;
  removeCursor: (userId: string) => void;
  setConnected: (connected: boolean) => void;
  setExecuting: (executing: boolean) => void;
  setExecutionOutput: (output: string | null) => void;
  setLocked: (locked: boolean) => void;
  reset: () => void;
}

const initialState = {
  room: null,
  files: [],
  activeFileId: null,
  users: new Map(),
  cursors: new Map(),
  isConnected: false,
  isExecuting: false,
  executionOutput: null,
  isLocked: false,
};

export const useRoomStore = create<RoomState>()((set) => ({
  ...initialState,
  setRoom: (room) => set({ room, isLocked: room.isLocked }),
  setFiles: (files) => set({ files }),
  addFile: (file) => set((s) => ({ files: [...s.files, file] })),
  removeFile: (fileId) => set((s) => ({ files: s.files.filter((f) => f.id !== fileId) })),
  setActiveFile: (fileId) => set({ activeFileId: fileId }),
  setUsers: (users) => set({ users: new Map(users.map((u) => [u.id, u])) }),
  addUser: (user) => set((s) => { const m = new Map(s.users); m.set(user.id, user); return { users: m }; }),
  removeUser: (userId) => set((s) => { const m = new Map(s.users); m.delete(userId); return { users: m }; }),
  updateUser: (userId, updates) => set((s) => {
    const m = new Map(s.users);
    const existing = m.get(userId);
    if (existing) m.set(userId, { ...existing, ...updates });
    return { users: m };
  }),
  setCursor: (userId, cursor) => set((s) => {
    const m = new Map(s.cursors); m.set(userId, cursor); return { cursors: m };
  }),
  removeCursor: (userId) => set((s) => {
    const m = new Map(s.cursors); m.delete(userId); return { cursors: m };
  }),
  setConnected: (isConnected) => set({ isConnected }),
  setExecuting: (isExecuting) => set({ isExecuting }),
  setExecutionOutput: (executionOutput) => set({ executionOutput }),
  setLocked: (isLocked) => set({ isLocked }),
  reset: () => set(initialState),
}));
