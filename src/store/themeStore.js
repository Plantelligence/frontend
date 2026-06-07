/**
 * themeStore — gerencia o tema claro/escuro.
 *
 * Padrão: claro (light) para todos os novos usuários.
 * Persistência: localStorage para acesso rápido + banco de dados para
 * sincronização entre dispositivos (via PATCH /api/users/me/preferences).
 *
 * Fluxo:
 *   1. Na carga inicial: aplica o tema salvo no localStorage (evita flash).
 *   2. No login: aplica o tema salvo no perfil do banco de dados.
 *   3. Na troca: salva no localStorage imediatamente + envia para o banco.
 */

import { useState, useEffect } from 'react';

const THEME_KEY = 'plantelligence-theme';

const getInitial = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'light'; // padrão: modo claro para novo acesso
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
  try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; }
};

/**
 * Salva a preferência de tema no banco de dados de forma assíncrona.
 * Falha silenciosamente se o usuário não estiver autenticado.
 */
const saveThemeToServer = async (theme) => {
  // Importa o cliente HTTP de forma lazy para evitar dependência circular
  // O path correto relativo a src/store/ é ../api/client.js
  try {
    const mod = await import('../api/client.js');
    const api = mod.default || mod;
    await api.patch('/users/me/preferences', { ui_theme: theme });
  } catch {
    // falha silenciosa — o tema local já está salvo
  }
};

export const toggleTheme = () => {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  applyTheme(next);
  saveThemeToServer(next);
  window.dispatchEvent(new CustomEvent('plantelligence-theme-change', { detail: { theme: next } }));
  return next;
};

/**
 * Aplica o tema vindo do perfil do servidor (chamado após login).
 * Garante que usuários vejam o mesmo tema em todos os dispositivos.
 *
 * @param {string} serverTheme - 'light' | 'dark' do perfil do usuário
 */
export const applyServerTheme = (serverTheme) => {
  if (serverTheme !== 'light' && serverTheme !== 'dark') return;
  try { localStorage.setItem(THEME_KEY, serverTheme); } catch {}
  applyTheme(serverTheme);
  window.dispatchEvent(new CustomEvent('plantelligence-theme-change', { detail: { theme: serverTheme } }));
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
