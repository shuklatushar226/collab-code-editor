import React from 'react';
import ReactDOM from 'react-dom/client';

// Wake up Render backend on app load (free tier sleeps after inactivity)
const API = import.meta.env.VITE_API_URL ?? 'https://collab-code-editor-n9j1.onrender.com';
fetch(`${API}/api/auth/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"name":"__ping__"}' }).catch(() => {});
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#2d2d30',
            color: '#cccccc',
            border: '1px solid #3e3e42',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
