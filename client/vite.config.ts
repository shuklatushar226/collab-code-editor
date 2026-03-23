import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@collab-editor/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/yjs': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  define: {
    // Fallback values when env vars are not set (e.g. Vercel build)
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL ?? 'https://collab-code-editor-n9j1.onrender.com'
    ),
    'import.meta.env.VITE_WS_URL': JSON.stringify(
      process.env.VITE_WS_URL ?? 'wss://collab-code-editor-n9j1.onrender.com'
    ),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'yjs': ['yjs', 'y-websocket', 'y-monaco'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  worker: { format: 'es' },
});
