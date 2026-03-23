import { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type * as Monaco from 'monaco-editor';
import { useUserStore } from '../store/userStore';
import { hashStringToColor } from '@collab-editor/shared';

interface UseYjsOptions {
  roomId: string;
  fileId: string;
  editor: Monaco.editor.IStandaloneCodeEditor | null;
}

export function useYjs({ roomId, fileId, editor }: UseYjsOptions) {
  const { user } = useUserStore();
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const cleanup = useCallback(() => {
    bindingRef.current?.destroy();
    bindingRef.current = null;
    providerRef.current?.destroy();
    providerRef.current = null;
    ydocRef.current?.destroy();
    ydocRef.current = null;
  }, []);

  useEffect(() => {
    if (!editor || !user || !roomId || !fileId) return;

    cleanup();

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // In dev: derive from window.location (goes through Vite WS proxy).
    // In prod: use VITE_WS_URL env var (e.g. wss://your-backend.railway.app).
    const wsBase = (import.meta.env.VITE_WS_URL ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`).trim();
    const wsUrl = `${wsBase}/yjs`;

    const provider = new WebsocketProvider(wsUrl, `${roomId}:${fileId}`, ydoc, {
      params: { roomId, fileId, userId: user.id },
    });
    providerRef.current = provider;

    // Set local user awareness
    provider.awareness.setLocalStateField('user', {
      name: user.name,
      color: hashStringToColor(user.id),
      userId: user.id,
    });

    const yText = ydoc.getText('content');
    const model = editor.getModel();

    if (model) {
      const monacoBinding = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        provider.awareness
      );
      bindingRef.current = monacoBinding;
    }

    return cleanup;
  }, [roomId, fileId, editor, user?.id]);

  return {
    ydoc: ydocRef.current,
    provider: providerRef.current,
  };
}
