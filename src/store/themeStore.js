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

// useState e useEffect: hooks do React para o componente de hook de tema
import { useState, useEffect } from 'react';

// Chave usada para persistir a preferência de tema no localStorage
const THEME_KEY = 'plantelligence-theme';

// Lê a preferência de tema do localStorage para aplicar antes da primeira renderização
const getInitial = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    // Só aceita valores válidos — ignora qualquer string corrompida
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'light'; // padrão: modo claro para novo acesso
};

// Aplica o tema adicionando a classe correta ao elemento raiz (html)
// O Tailwind usa a classe 'dark' no elemento raiz para ativar as variantes dark:
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
// Executado na inicialização do módulo, antes da primeira renderização do React
applyTheme(getInitial());

// Função utilitária para ler o tema atual de qualquer lugar sem hook
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
    // Envia a preferência para o banco — permite sincronizar entre dispositivos
    await api.patch('/users/me/preferences', { ui_theme: theme });
  } catch {
    // falha silenciosa — o tema local já está salvo
  }
};

// Alterna entre claro e escuro, persiste localmente e sincroniza com o servidor
export const toggleTheme = () => {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  // Salva imediatamente no localStorage para responsividade instantânea
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  applyTheme(next);
  // Sincroniza com o banco em segundo plano (falha silenciosamente se offline)
  saveThemeToServer(next);
  // Dispara evento customizado para que outros componentes reajam à mudança de tema
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
  // Valida o valor antes de aplicar — rejeita temas inválidos
  if (serverTheme !== 'light' && serverTheme !== 'dark') return;
  try { localStorage.setItem(THEME_KEY, serverTheme); } catch {}
  applyTheme(serverTheme);
  // Notifica todos os listeners para atualizar o estado do hook useTheme
  window.dispatchEvent(new CustomEvent('plantelligence-theme-change', { detail: { theme: serverTheme } }));
};

// Hook React para acessar e reagir a mudanças de tema em componentes funcionais
export const useTheme = () => {
  // Estado local sincronizado com o localStorage via evento customizado
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    // Ouve o evento de mudança de tema disparado por toggleTheme ou applyServerTheme
    const handler = (e) => setTheme(e.detail.theme);
    window.addEventListener('plantelligence-theme-change', handler);
    // Remove o listener ao desmontar o componente para evitar vazamento de memória
    return () => window.removeEventListener('plantelligence-theme-change', handler);
  }, []);

  // Retorna o tema atual e uma função de alternância que atualiza o estado do hook
  return { theme, toggleTheme: () => setTheme(toggleTheme()) };
};
