import Docker from 'dockerode';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { ExecutionRequest, ExecutionResult, LanguageConfig } from '../types';
import { logger } from '../logger';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MEMORY_MB = 128;
const MAX_OUTPUT_BYTES = 1024 * 1024; // 1MB

export async function runInSandbox(
  request: ExecutionRequest,
  config: LanguageConfig
): Promise<ExecutionResult> {
  const jobId = uuid();
  const workDir = path.join(os.tmpdir(), `exec-${jobId}`);
  const startTime = Date.now();

  try {
    // Create temp directory and write code file
    await fs.mkdir(workDir, { recursive: true });
    const codeFile = path.join(workDir, config.filename);
    await fs.writeFile(codeFile, request.code, 'utf-8');

    // Write stdin to file if provided
    let stdinContent = request.stdin ?? '';

    const timeoutMs = Math.min(request.timeoutMs ?? DEFAULT_TIMEOUT_MS, 30_000);
    const memoryMb = Math.min(request.memoryLimitMb ?? DEFAULT_MEMORY_MB, 512);

    // Security-hardened container config
    const containerConfig: Docker.ContainerCreateOptions = {
      Image: config.image,
      Cmd: config.runCmd,
      WorkingDir: '/workspace',
      StdinOnce: true,
      OpenStdin: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      HostConfig: {
        Memory: memoryMb * 1024 * 1024,
        MemorySwap: memoryMb * 1024 * 1024, // No swap
        CpuPeriod: 100000,
        CpuQuota: 50000, // 50% of one CPU
        NetworkMode: 'none', // No network access
        ReadonlyRootfs: false,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        PidsLimit: 50,
        AutoRemove: false,
        Binds: [`${workDir}:/workspace:rw`],
        Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=32m' },
      },
      Env: [
        'HOME=/tmp',
        'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      ],
      User: 'nobody',
    };

    // If there's a compile step, run it first
    if (config.compileCmd) {
      const compileResult = await runContainer(
        { ...containerConfig, Cmd: config.compileCmd },
        stdinContent,
        5000, // 5s compile timeout
        jobId,
        workDir,
        config
      );
      if (compileResult.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileResult.stderr,
          exitCode: compileResult.exitCode,
          executionTimeMs: Date.now() - startTime,
          timedOut: false,
          status: 'compile_error',
        };
      }
    }

    const result = await runContainer(containerConfig, stdinContent, timeoutMs, jobId, workDir, config);

    return {
      ...result,
      executionTimeMs: Date.now() - startTime,
      status: result.timedOut ? 'timeout' : result.exitCode === 0 ? 'success' : 'error',
    };
  } finally {
    // Cleanup temp directory
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function runContainer(
  config: Docker.ContainerCreateOptions,
  stdin: string,
  timeoutMs: number,
  jobId: string,
  workDir: string,
  langConfig: LanguageConfig
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  let container: Docker.Container | null = null;
  let timedOut = false;

  try {
    container = await docker.createContainer({
      ...config,
      name: `exec-${jobId}-${Date.now()}`,
    });

    // Attach to get output streams
    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    });

    await container.start();

    // Write stdin
    if (stdin) {
      stream.write(stdin);
      stream.end();
    }

    // Set up timeout
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        timedOut = true;
        reject(new Error('TIMEOUT'));
      }, timeoutMs);
    });

    // Collect output
    let stdout = '';
    let stderr = '';
    let outputBytes = 0;

    const outputPromise = new Promise<void>((resolve) => {
      container!.modem.demuxStream(stream,
        {
          write: (chunk: Buffer) => {
            outputBytes += chunk.length;
            if (outputBytes < MAX_OUTPUT_BYTES) {
              stdout += chunk.toString();
            }
          }
        },
        {
          write: (chunk: Buffer) => {
            outputBytes += chunk.length;
            if (outputBytes < MAX_OUTPUT_BYTES) {
              stderr += chunk.toString();
            }
          }
        }
      );
      stream.on('end', resolve);
      stream.on('error', resolve);
    });

    try {
      await Promise.race([outputPromise, timeoutPromise]);
    } catch (err: any) {
      if (err.message !== 'TIMEOUT') throw err;
    }

    // Wait for container to exit
    let exitCode = 1;
    try {
      const waitResult = await Promise.race([
        container.wait(),
        new Promise<{ StatusCode: number }>((_, reject) =>
          setTimeout(() => reject(new Error('WAIT_TIMEOUT')), 3000)
        ),
      ]);
      exitCode = waitResult.StatusCode;
    } catch {
      exitCode = timedOut ? 124 : 1;
    }

    if (timedOut && stdout === '') {
      stderr = `Execution timed out after ${timeoutMs / 1000}s`;
    }

    return {
      stdout: stdout.slice(0, 50_000), // Limit output size
      stderr: stderr.slice(0, 10_000),
      exitCode,
      timedOut
    };
  } finally {
    // Always cleanup container
    if (container) {
      try {
        await container.kill().catch(() => {});
        await container.remove({ force: true }).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

export async function checkDockerAvailable(): Promise<void> {
  await docker.ping();
  logger.info('Docker daemon is available');
}
