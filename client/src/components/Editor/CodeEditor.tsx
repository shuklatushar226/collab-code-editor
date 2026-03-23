import { useRef, useCallback, useEffect, useState } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import { getSocket } from '../../services/socket';
import { useYjs } from '../../hooks/useYjs';

interface Props {
  roomId: string;
}

export default function CodeEditor({ roomId }: Props) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const { files, activeFileId, isLocked, cursors, users } = useRoomStore();
  const { user } = useUserStore();
  const socket = getSocket();
  const activeFile = files.find((f) => f.id === activeFileId);

  const { } = useYjs({
    roomId,
    fileId: activeFileId ?? '',
    editor: editorRef.current,
  });

  // Re-run Yjs whenever editor or fileId changes
  const [editorMounted, setEditorMounted] = useRefState(false);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    setEditorMounted(true);

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      if (!user || !activeFileId) return;
      socket.emit('cursor:update', {
        roomId,
        userId: user.id,
        cursor: {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        },
      });
    });

    // Configure Monaco
    editor.addCommand(
      // Ctrl+S / Cmd+S — save version
      (window as any).monaco?.KeyMod?.CtrlCmd | (window as any).monaco?.KeyCode?.KeyS,
      () => { /* handled by toolbar */ }
    );
  }, [roomId, user, activeFileId]);

  // Render remote cursors as decorations
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const decorations: Monaco.editor.IModelDeltaDecoration[] = [];

    cursors.forEach((cursor, userId) => {
      if (userId === user?.id) return;
      const remoteUser = users.get(userId);
      if (!remoteUser) return;

      decorations.push({
        range: {
          startLineNumber: cursor.lineNumber,
          startColumn: cursor.column,
          endLineNumber: cursor.lineNumber,
          endColumn: cursor.column + 1,
        },
        options: {
          className: 'remote-cursor',
          beforeContentClassName: 'remote-cursor-beam',
          after: {
            content: remoteUser.name,
            inlineClassName: 'remote-cursor-label',
          },
          stickiness: 1,
        },
      });
    });

    const ids = editor.deltaDecorations([], decorations);
    return () => { editor.deltaDecorations(ids, []); };
  }, [cursors, users, user?.id]);

  return (
    <div className="flex-1 min-h-0 relative">
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-black/20 flex items-center justify-center pointer-events-none">
          <div className="bg-red-900/80 text-red-200 px-4 py-2 rounded-lg text-sm font-medium">
            Editor Locked by Interviewer
          </div>
        </div>
      )}
      <MonacoEditor
        height="100%"
        language={activeFile?.language ?? 'javascript'}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: true },
          wordWrap: 'on',
          tabSize: 2,
          readOnly: isLocked,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          suggest: { preview: true },
          quickSuggestions: true,
          formatOnType: true,
          padding: { top: 8 },
        }}
      />
    </div>
  );
}

// Helper hook for ref-based state to avoid stale closures
function useRefState<T>(initial: T): [T, (v: T) => void] {
  const ref = useRef(initial);
  const [, setTick] = useState(0);
  return [
    ref.current,
    (v: T) => { ref.current = v; setTick((t: number) => t + 1); },
  ];
}
