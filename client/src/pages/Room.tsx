import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import Header from '../components/Layout/Header';
import FileTree from '../components/FileExplorer/FileTree';
import EditorToolbar from '../components/Editor/EditorToolbar';
import OutputPanel from '../components/Output/OutputPanel';
import PresenceList from '../components/Presence/PresenceList';
import VersionList from '../components/VersionHistory/VersionList';
import InterviewPanel from '../components/InterviewMode/InterviewPanel';
import { useRoom } from '../hooks/useRoom';
import { useYjs } from '../hooks/useYjs';
import { useUserStore } from '../store/userStore';
import { useRoomStore } from '../store/roomStore';
import { getSocket } from '../services/socket';
import { isValidRoomId } from '@collab-editor/shared';
import toast from 'react-hot-toast';

type SidePanel = 'files' | 'versions' | 'interview' | null;

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>('files');
  const [showOutput, setShowOutput] = useState(true);

  // Validate room ID
  useEffect(() => {
    if (!roomId || !isValidRoomId(roomId)) {
      toast.error('Invalid room ID');
      navigate('/');
    }
  }, [roomId]);

  // Redirect to login if no user
  useEffect(() => {
    if (!user) navigate(`/?join=${roomId}`);
  }, [user]);

  const { files, activeFileId, room, executionOutput } = useRoom(roomId ?? '');
  const activeFile = files.find((f) => f.id === activeFileId);

  // Yjs integration
  useYjs({
    roomId: roomId ?? '',
    fileId: activeFileId ?? '',
    editor: editorRef.current,
  });

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const getEditorValue = () => editorRef.current?.getValue() ?? '';

  if (!roomId || !user) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-editor-bg">
      <Header roomId={roomId} />

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar icons */}
        <div className="flex flex-col items-center gap-1 py-2 px-1 bg-editor-sidebar border-r border-editor-border w-10 shrink-0">
          {[
            { id: 'files' as SidePanel, icon: '📁', title: 'Files' },
            { id: 'versions' as SidePanel, icon: '🕐', title: 'History' },
            ...(room?.isInterviewMode ? [{ id: 'interview' as SidePanel, icon: '🎯', title: 'Interview' }] : []),
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSidePanel(sidePanel === item.id ? null : item.id)}
              title={item.title}
              className={`w-8 h-8 flex items-center justify-center rounded text-base transition-colors ${
                sidePanel === item.id ? 'bg-editor-accent/30' : 'hover:bg-editor-panel'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>

        {/* Side panel */}
        {sidePanel && (
          <div className="w-52 shrink-0 bg-editor-sidebar border-r border-editor-border flex flex-col overflow-hidden">
            {sidePanel === 'files' && <FileTree roomId={roomId} />}
            {sidePanel === 'versions' && (
              <VersionList
                roomId={roomId}
                onRestore={(content) => editorRef.current?.setValue(content)}
              />
            )}
            {sidePanel === 'interview' && <InterviewPanel roomId={roomId} />}
          </div>
        )}

        {/* Main editor area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* File tabs */}
          <div className="flex items-center gap-0 bg-editor-sidebar border-b border-editor-border overflow-x-auto">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => useRoomStore.getState().setActiveFile(file.id)}
                className={`px-4 py-2 text-sm font-mono whitespace-nowrap border-r border-editor-border transition-colors ${
                  activeFileId === file.id
                    ? 'bg-editor-bg text-white border-t-2 border-t-blue-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-editor-panel'
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>

          <EditorToolbar roomId={roomId} getEditorValue={getEditorValue} />

          <div className="flex-1 min-h-0 flex flex-col">
            <div className={showOutput && executionOutput ? 'flex-1 min-h-0' : 'flex-1'}>
              <MonacoEditor
                height="100%"
                language={activeFile?.language ?? 'javascript'}
                theme="vs-dark"
                onMount={handleEditorMount}
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', Consolas, monospace",
                  fontLigatures: true,
                  minimap: { enabled: files.length <= 3 },
                  wordWrap: 'on',
                  tabSize: 2,
                  readOnly: useRoomStore.getState().isLocked,
                  smoothScrolling: true,
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'all',
                  bracketPairColorization: { enabled: true },
                  padding: { top: 8, bottom: 8 },
                }}
              />
            </div>

            {showOutput && executionOutput && (
              <div className="h-48 shrink-0">
                <OutputPanel onClose={() => setShowOutput(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
