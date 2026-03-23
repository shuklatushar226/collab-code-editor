import { SupportedLanguage } from './room';

export interface ExecutionRequest {
  code: string;
  language: SupportedLanguage;
  stdin?: string;
  timeoutMs?: number;
  memoryLimitMb?: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsedMb?: number;
  timedOut: boolean;
  status: 'success' | 'error' | 'timeout' | 'memory_limit' | 'compile_error';
}

export interface ExecutionJob {
  id: string;
  roomId: string;
  fileId: string;
  request: ExecutionRequest;
  result?: ExecutionResult;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}
