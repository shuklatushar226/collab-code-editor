import { useState, useEffect } from 'react';
import { Timer, Lock, Unlock, Send } from 'lucide-react';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import { getSocket } from '../../services/socket';

interface Props { roomId: string }

export default function InterviewPanel({ roomId }: Props) {
  const { room, isLocked } = useRoomStore();
  const { user } = useUserStore();
  const socket = getSocket();
  const [question, setQuestion] = useState('');
  const [timerMs, setTimerMs] = useState(3600000); // 1 hour default
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const isInterviewer = room?.interviewerId === user?.id || room?.createdBy === user?.id;

  useEffect(() => {
    socket.on('interview:timer:update', ({ remainingMs: ms }) => setRemainingMs(ms));
    return () => { socket.off('interview:timer:update'); };
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    socket.emit('interview:timer:start', { roomId, durationMs: timerMs });
  };

  const handleToggleLock = () => {
    socket.emit('interview:lock', { roomId, lock: !isLocked });
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Interview Mode</div>

      {/* Timer */}
      <div className="panel p-3">
        <div className="flex items-center gap-2 mb-2">
          <Timer size={14} className="text-orange-400" />
          <span className="text-sm font-medium">Timer</span>
        </div>
        {remainingMs !== null ? (
          <div className={`text-2xl font-mono font-bold text-center py-2 ${remainingMs < 60000 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {formatTime(remainingMs)}
          </div>
        ) : (
          <div className="flex gap-2">
            <select
              value={timerMs}
              onChange={(e) => setTimerMs(Number(e.target.value))}
              className="input flex-1 text-sm"
            >
              <option value={1800000}>30 min</option>
              <option value={3600000}>60 min</option>
              <option value={5400000}>90 min</option>
              <option value={7200000}>2 hours</option>
            </select>
            {isInterviewer && (
              <button onClick={handleStartTimer} className="btn-primary text-sm px-3">Start</button>
            )}
          </div>
        )}
      </div>

      {/* Lock */}
      {isInterviewer && (
        <button
          onClick={handleToggleLock}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
            isLocked
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-editor-panel hover:bg-editor-border text-gray-300 border border-editor-border'
          }`}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          {isLocked ? 'Unlock Editor' : 'Lock Editor'}
        </button>
      )}

      {/* Question panel */}
      <div className="panel p-3">
        <div className="text-xs font-semibold text-gray-400 mb-2">Question</div>
        {isInterviewer ? (
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Write the interview question here..."
            className="input text-sm resize-none"
            rows={6}
          />
        ) : (
          <div className="text-sm text-gray-300 whitespace-pre-wrap min-h-16">
            {question || <span className="text-gray-500">Waiting for question...</span>}
          </div>
        )}
      </div>
    </div>
  );
}
