import { useCallback } from 'react';
import { executionApi } from '../services/api';
import { useRoomStore } from '../store/roomStore';
import toast from 'react-hot-toast';

export function useExecution() {
  const { files, activeFileId, setExecuting, setExecutionOutput } = useRoomStore();

  const runCode = useCallback(async (code: string) => {
    const activeFile = files.find((f) => f.id === activeFileId);
    if (!activeFile) { toast.error('No file selected'); return; }

    setExecuting(true);
    setExecutionOutput(null);

    try {
      const { data } = await executionApi.execute({
        code,
        language: activeFile.language,
      });

      setExecutionOutput(
        `✓ Executed in ${data.executionTimeMs}ms (exit: ${data.exitCode})\n` +
        `${'─'.repeat(40)}\n` +
        (data.stdout || '(no output)') +
        (data.stderr ? `\n\nStderr:\n${data.stderr}` : '')
      );
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Execution failed';
      toast.error(msg);
      setExecutionOutput(`Error: ${msg}`);
    } finally {
      setExecuting(false);
    }
  }, [files, activeFileId]);

  return { runCode };
}
