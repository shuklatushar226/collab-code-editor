import { Router } from 'express';
import { z } from 'zod';
import { executionLimiter } from '../middleware/rateLimit';
import axios from 'axios';
import { CONFIG } from '../../config';
import { isExecutableLanguage } from '@collab-editor/shared';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

const ExecuteSchema = z.object({
  code: z.string().min(1).max(100_000),
  language: z.string(),
  stdin: z.string().max(10_000).optional(),
  timeoutMs: z.number().min(1000).max(30_000).optional(),
});

// Piston API language mapping (fallback when local executor is unavailable)
const PISTON_LANG_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  python:     { language: 'python',     version: '3.10.0' },
  java:       { language: 'java',       version: '15.0.2' },
  cpp:        { language: 'c++',        version: '10.2.0' },
};

async function runWithPiston(
  code: string,
  language: string,
  stdin?: string
): Promise<{ stdout: string; stderr: string; exitCode: number; executionTimeMs: number; timedOut: boolean; status: string }> {
  const langConfig = PISTON_LANG_MAP[language];
  if (!langConfig) throw new Error(`No Piston mapping for language: ${language}`);

  const start = Date.now();
  const response = await axios.post(
    'https://emkc.org/api/v2/piston/execute',
    {
      language: langConfig.language,
      version: langConfig.version,
      files: [{ content: code }],
      stdin: stdin ?? '',
      run_timeout: 10000,
    },
    { timeout: 15_000 }
  );

  const run = response.data.run;
  const exitCode: number = run.code ?? 0;
  const stdout: string = run.stdout ?? '';
  const stderr: string = run.stderr ?? '';

  return {
    stdout,
    stderr,
    exitCode,
    executionTimeMs: Date.now() - start,
    timedOut: run.signal === 'SIGKILL',
    status: exitCode === 0 ? 'success' : 'error',
  };
}

router.post('/execute', executionLimiter, async (req, res, next) => {
  try {
    const { code, language, stdin, timeoutMs } = ExecuteSchema.parse(req.body);

    if (!isExecutableLanguage(language)) {
      throw new AppError(`Language '${language}' is not supported for execution`, 400, 'UNSUPPORTED_LANGUAGE');
    }

    // Try local Docker executor first; fall back to Piston if unavailable
    try {
      const response = await axios.post(
        `${CONFIG.EXECUTOR.URL}/execute`,
        { code, language, stdin, timeoutMs },
        { timeout: CONFIG.EXECUTOR.TIMEOUT_MS }
      );
      return res.json(response.data);
    } catch (localErr) {
      if (axios.isAxiosError(localErr)) {
        logger.warn(`Local executor unavailable, falling back to Piston API`);
      } else {
        throw localErr;
      }
    }

    // Piston fallback
    const result = await runWithPiston(code, language, stdin);
    res.json(result);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      next(new AppError('All execution services unavailable', 503, 'EXECUTOR_UNAVAILABLE'));
    } else {
      next(err);
    }
  }
});

export default router;
