import { X, Terminal } from 'lucide-react';
import { useRoomStore } from '../../store/roomStore';
import clsx from 'clsx';

interface Props { onClose?: () => void }

export default function OutputPanel({ onClose }: Props) {
  const { executionOutput, isExecuting } = useRoomStore();

  return (
    <div className="flex flex-col h-full bg-editor-bg border-t border-editor-border">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-editor-sidebar border-b border-editor-border">
        <Terminal size={14} className="text-green-400" />
        <span className="text-xs font-semibold text-gray-400">OUTPUT</span>
        <div className="flex-1" />
        {isExecuting && (
          <span className="text-xs text-yellow-400 animate-pulse">Running...</span>
        )}
        {onClose && (
          <button onClick={onClose} className="p-0.5 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      <pre
        className={clsx(
          'flex-1 p-3 text-sm font-mono overflow-auto text-green-300',
          !executionOutput && 'text-gray-500'
        )}
      >
        {executionOutput ?? '// Run your code to see output here'}
      </pre>
    </div>
  );
}
