import { useState, useEffect } from 'react';
import { versionApi } from '../../services/api';
import { useRoomStore } from '../../store/roomStore';
import { formatDistanceToNow } from 'date-fns';
import { History, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Version {
  id: string;
  label: string | null;
  created_at: string;
}

interface Props {
  roomId: string;
  onRestore?: (content: string) => void;
}

export default function VersionList({ roomId, onRestore }: Props) {
  const { activeFileId } = useRoomStore();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeFileId) return;
    setLoading(true);
    versionApi.list(roomId, activeFileId)
      .then(({ data }) => setVersions(data))
      .catch(() => toast.error('Failed to load versions'))
      .finally(() => setLoading(false));
  }, [roomId, activeFileId]);

  const handleRestore = async (versionId: string) => {
    try {
      const { data } = await versionApi.get(versionId);
      onRestore?.(data.content);
      toast.success('Version restored');
    } catch { toast.error('Failed to restore version'); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-editor-border">
        <History size={14} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Version History</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
        )}
        {!loading && versions.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">No versions saved yet.<br/>Press Save to create one.</div>
        )}
        {versions.map((v) => (
          <div key={v.id} className="group flex items-center gap-2 px-3 py-2 hover:bg-editor-panel border-b border-editor-border/50">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-300 truncate">{v.label ?? 'Unnamed'}</div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
              </div>
            </div>
            <button
              onClick={() => handleRestore(v.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-all"
              title="Restore this version"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
