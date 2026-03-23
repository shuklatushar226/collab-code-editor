import { Play, Save, Plus, Lock, Unlock, Timer } from 'lucide-react';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import { useExecution } from '../../hooks/useExecution';
import { versionApi } from '../../services/api';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Props {
  roomId: string;
  getEditorValue: () => string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JS', typescript: 'TS', python: 'PY',
  java: 'JAVA', cpp: 'C++', go: 'GO', rust: 'RS',
};

export default function EditorToolbar({ roomId, getEditorValue }: Props) {
  const { files, activeFileId, isExecuting, isLocked, room } = useRoomStore();
  const { user } = useUserStore();
  const { runCode } = useExecution();
  const socket = getSocket();
  const activeFile = files.find((f) => f.id === activeFileId);
  const isInterviewer = room?.interviewerId === user?.id;

  const handleRun = () => {
    const code = getEditorValue();
    runCode(code);
  };

  const handleSave = async () => {
    const code = getEditorValue();
    if (!activeFileId) return;
    try {
      await versionApi.save(roomId, { fileId: activeFileId, content: code });
      toast.success('Version saved');
      socket.emit('version:save', { roomId, fileId: activeFileId });
    } catch { toast.error('Failed to save version'); }
  };

  const handleLock = () => {
    socket.emit('interview:lock', { roomId, lock: !isLocked });
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-editor-sidebar border-b border-editor-border">
      {/* Language badge */}
      {activeFile && (
        <span className="text-xs font-mono bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">
          {LANGUAGE_LABELS[activeFile.language] ?? activeFile.language.toUpperCase()}
        </span>
      )}

      <div className="flex-1" />

      {/* Run */}
      <button
        onClick={handleRun}
        disabled={isExecuting || !activeFile}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
          isExecuting
            ? 'bg-green-800 text-green-300 cursor-wait'
            : 'bg-green-700 hover:bg-green-600 text-white'
        )}
      >
        <Play size={14} />
        {isExecuting ? 'Running...' : 'Run'}
      </button>

      {/* Save version */}
      <button onClick={handleSave} className="btn-secondary flex items-center gap-1.5 py-1.5 text-sm">
        <Save size={14} />
        Save
      </button>

      {/* Interview: Lock/Unlock */}
      {room?.isInterviewMode && isInterviewer && (
        <button
          onClick={handleLock}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
            isLocked
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-editor-panel hover:bg-editor-border text-editor-text border border-editor-border'
          )}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          {isLocked ? 'Unlock' : 'Lock'}
        </button>
      )}
    </div>
  );
}
