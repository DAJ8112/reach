import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { App } from './App.js';
import { ThemeProvider, useTheme } from './lib/theme.js';
import './styles/globals.css';

function AppShell() {
  const { theme } = useTheme();

  return (
    <>
      <App />
      <Toaster
        theme={theme}
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
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  </React.StrictMode>,
);
