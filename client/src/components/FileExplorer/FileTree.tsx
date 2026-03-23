import { useState } from 'react';
import { Plus, Trash2, File } from 'lucide-react';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import { getSocket } from '../../services/socket';
import { roomApi } from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Props { roomId: string }

const LANGUAGE_ICONS: Record<string, string> = {
  javascript: '🟨', typescript: '🔷', python: '🐍',
  java: '☕', cpp: '⚙️', go: '🐹', rust: '🦀',
  html: '🌐', css: '🎨', json: '📋', markdown: '📝',
};

export default function FileTree({ roomId }: Props) {
  const { files, activeFileId, setActiveFile } = useRoomStore();
  const { user } = useUserStore();
  const socket = getSocket();
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleSelectFile = (fileId: string) => {
    setActiveFile(fileId);
    socket.emit('file:select', { roomId, fileId });
  };

  const handleCreateFile = async () => {
    const name = newFileName.trim();
    if (!name) { setCreating(false); return; }
    try {
      await roomApi.createFile(roomId, name);
      socket.emit('file:create', { roomId, name, language: 'javascript' });
      setNewFileName('');
      setCreating(false);
      toast.success(`Created ${name}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create file');
    }
  };

  const handleDeleteFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) { toast.error('Cannot delete the last file'); return; }
    socket.emit('file:delete', { roomId, fileId });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-editor-border">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Files</span>
        <button
          onClick={() => setCreating(true)}
          className="p-1 hover:bg-editor-border rounded transition-colors"
          title="New file"
        >
          <Plus size={14} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => handleSelectFile(file.id)}
            className={clsx(
              'group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors',
              activeFileId === file.id
                ? 'bg-editor-accent/20 text-white'
                : 'hover:bg-editor-panel text-gray-300'
            )}
          >
            <span className="text-sm">{LANGUAGE_ICONS[file.language] ?? '📄'}</span>
            <span className="flex-1 text-sm truncate font-mono">{file.name}</span>
            {files.length > 1 && (
              <button
                onClick={(e) => handleDeleteFile(file.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        {creating && (
          <div className="px-3 py-1.5">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') { setCreating(false); setNewFileName(''); }
              }}
              onBlur={handleCreateFile}
              placeholder="filename.js"
              className="w-full text-sm bg-editor-panel border border-blue-500 rounded px-2 py-1 text-white placeholder-gray-500 outline-none font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
}
