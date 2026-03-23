export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp';

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

export interface LanguageConfig {
  image: string;
  filename: string;
  compileCmd?: string[];
  runCmd: string[];
  fileExtension: string;
}
