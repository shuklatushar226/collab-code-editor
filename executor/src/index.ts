import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { runInSandbox } from './sandbox/docker';
import { LANGUAGE_CONFIGS } from './languages';
import { checkDockerAvailable } from './sandbox/docker';
import { logger } from './logger';
import { SupportedLanguage } from './types';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3003');

app.use(helmet());
app.use(express.json({ limit: '2mb' }));

// Internal network rate limit (executor is only accessible from server)
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

const ExecuteSchema = z.object({
  code: z.string().min(1).max(100_000),
  language: z.enum(['javascript', 'typescript', 'python', 'java', 'cpp']),
  stdin: z.string().max(10_000).optional().default(''),
  timeoutMs: z.number().min(1000).max(30_000).optional().default(10_000),
  memoryLimitMb: z.number().min(32).max(512).optional().default(128),
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/execute', async (req, res) => {
  const parseResult = ExecuteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid request', details: parseResult.error.errors });
  }

  const request = parseResult.data;
  const config = LANGUAGE_CONFIGS[request.language as SupportedLanguage];

  if (!config) {
    return res.status(400).json({ error: `Language '${request.language}' not supported` });
  }

  logger.info(`Executing ${request.language} (${request.code.length} bytes)`);

  try {
    const result = await runInSandbox(request, config);
    logger.info(`Execution complete: exit=${result.exitCode} time=${result.executionTimeMs}ms status=${result.status}`);
    res.json(result);
  } catch (err: any) {
    logger.error('Execution failed:', err);
    res.status(500).json({
      stdout: '',
      stderr: 'Internal execution error',
      exitCode: 1,
      executionTimeMs: 0,
      timedOut: false,
      status: 'error',
    });
  }
});

async function start() {
  await checkDockerAvailable();
  app.listen(PORT, () => {
    logger.info(`Executor service running on port ${PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start executor:', err);
  process.exit(1);
});
