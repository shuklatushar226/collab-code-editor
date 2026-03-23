import { Copy, Check, Users, Code2, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PresenceList from '../Presence/PresenceList';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';

interface Props { roomId?: string }

export default function Header({ roomId }: Props) {
  const [copied, setCopied] = useState(false);
  const { room, isConnected } = useRoomStore();
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-editor-sidebar border-b border-editor-border h-12 shrink-0">
      <div className="flex items-center gap-2">
        <Code2 size={20} className="text-blue-400" />
        <span className="font-semibold text-white text-sm">CollabCode</span>
      </div>

      {room && (
        <div className="flex items-center gap-2 ml-2">
          <span className="text-gray-400 text-sm">/</span>
          <span className="text-sm text-gray-300">{room.name}</span>
          {room.isInterviewMode && (
            <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded">Interview</span>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Connection status */}
      <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {roomId && <PresenceList />}

      {roomId && (
        <button onClick={handleCopyLink} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Share'}
        </button>
      )}

      {user && (
        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm text-gray-400">{user.name}</span>
          <button
            onClick={() => { clearUser(); navigate('/'); }}
            className="p-1 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </header>
  );
}
