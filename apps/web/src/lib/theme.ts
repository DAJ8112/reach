import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createElement } from 'react';

export type Theme = 'light' | 'dark';

export const STORAGE_KEY = 'reach-theme';

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function getSystemTheme(): Theme {
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function resolveTheme(stored: string | null): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable
  }
  return null;
}

export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme(getStoredTheme()));
  const [hasOverride, setHasOverride] = useState(() => getStoredTheme() !== null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (hasOverride) return;

    const mq = window.matchMedia(MEDIA_QUERY);
    const onChange = () => setThemeState(getSystemTheme());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [hasOverride]);

  const setTheme = useCallback((next: Theme) => {
    setStoredTheme(next);
    setHasOverride(true);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      setStoredTheme(next);
      setHasOverride(true);
      return next;
    });
  }, []);

  return createElement(
    ThemeContext.Provider,
    { value: { theme, setTheme, toggleTheme } },
    children,
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
