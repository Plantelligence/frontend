/**
 * themeStore — gerencia o tema claro/escuro.
 * Persiste em localStorage e aplica class="dark" no <html>.
 */

import { useState, useEffect } from 'react';

const THEME_KEY = 'plantelligence-theme';

const getInitial = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark'; // padrão do app
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
};

// Aplica imediatamente ao importar (evita flash de tema errado)
applyTheme(getInitial());

export const getTheme = () => {
  try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch { return 'dark'; }
};

export const toggleTheme = () => {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  applyTheme(next);
  window.dispatchEvent(new CustomEvent('plantelligence-theme-change', { detail: { theme: next } }));
  return next;
};

export const useTheme = () => {
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    const handler = (e) => setTheme(e.detail.theme);
    window.addEventListener('plantelligence-theme-change', handler);
    return () => window.removeEventListener('plantelligence-theme-change', handler);
  }, []);

  return { theme, toggleTheme: () => setTheme(toggleTheme()) };
};
