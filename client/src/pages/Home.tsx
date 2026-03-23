import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Zap, Users, Lock, Terminal, GitBranch } from 'lucide-react';
import { roomApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function HomePage() {
  const [roomId, setRoomId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const { user, setUser } = useUserStore();
  const navigate = useNavigate();

  const ensureUser = async (): Promise<boolean> => {
    if (user) return true;
    const name = guestName.trim() || `Guest ${Math.floor(Math.random() * 1000)}`;
    try {
      const { data } = await import('../services/api').then(m => m.authApi.guest({ name }));
      setUser(data.user, data.token);
      return true;
    } catch {
      toast.error('Failed to create guest session');
      return false;
    }
  };

  const handleCreateRoom = async () => {
    const ok = await ensureUser();
    if (!ok) return;
    setIsCreating(true);
    try {
      const { data } = await roomApi.create({ isInterviewMode });
      navigate(`/room/${data.roomId}`);
    } catch { toast.error('Failed to create room'); }
    finally { setIsCreating(false); }
  };

  const handleJoinRoom = async () => {
    const id = roomId.trim().toUpperCase();
    if (!id) { toast.error('Enter a room ID'); return; }
    const ok = await ensureUser();
    if (!ok) return;
    navigate(`/room/${id}`);
  };

  return (
    <div className="min-h-screen bg-editor-bg flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-600/20 rounded-2xl">
                <Code2 size={40} className="text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">CollabCode</h1>
            <p className="text-gray-400 text-lg">Real-time collaborative coding. No friction.</p>
          </div>

          {/* Action card */}
          <div className="panel p-6 space-y-5">
            {!user && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Your name (optional)</label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Anonymous coder"
                  className="input"
                />
              </div>
            )}

            {/* Create room */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="interviewMode"
                  checked={isInterviewMode}
                  onChange={(e) => setIsInterviewMode(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <label htmlFor="interviewMode" className="text-sm text-gray-300 cursor-pointer">
                  Interview Mode (interviewer + candidate)
                </label>
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="btn-primary w-full py-3 text-base"
              >
                {isCreating ? 'Creating...' : '+ Create New Room'}
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-editor-border" />
              <span className="px-3 text-gray-500 text-sm">or join existing</span>
              <div className="flex-1 border-t border-editor-border" />
            </div>

            {/* Join room */}
            <div className="flex gap-2">
              <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder="ROOM-ID (e.g. ABCD-1234)"
                className="input flex-1 font-mono uppercase tracking-wider"
                maxLength={9}
              />
              <button onClick={handleJoinRoom} className="btn-secondary px-5">Join</button>
            </div>
          </div>

          {/* Feature badges */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: <Zap size={16} />, label: 'Real-time CRDT sync' },
              { icon: <Users size={16} />, label: 'Live cursors' },
              { icon: <Terminal size={16} />, label: 'Code execution' },
              { icon: <Lock size={16} />, label: 'Interview mode' },
              { icon: <GitBranch size={16} />, label: 'Version history' },
              { icon: <Code2 size={16} />, label: 'Monaco editor' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 p-2.5 bg-editor-panel rounded-lg text-xs text-gray-400">
                <span className="text-blue-400">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
