export type UserRole = 'admin' | 'editor' | 'viewer';

export interface RoomUser {
  id: string;
  name: string;
  color: string;
  role: UserRole;
  isOnline: boolean;
  cursor?: CursorPosition;
  lastSeen: number;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  selection?: SelectionRange;
}

export interface SelectionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  isInterviewMode: boolean;
  interviewerId?: string;
  candidateId?: string;
  isLocked: boolean;
  activeFileId: string;
  users: RoomUser[];
}

export interface FileNode {
  id: string;
  name: string;
  language: SupportedLanguage;
  content: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'go' | 'rust' | 'html' | 'css' | 'json' | 'markdown';
