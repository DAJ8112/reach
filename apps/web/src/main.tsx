import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { App } from './App.js';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      theme="dark"
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'var(--bg-elev)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        },
      }}
    />
  </React.StrictMode>,
);
