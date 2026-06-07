/**
 * authStore.js - Estado global de autenticação (Zustand).
 *
 * Gerencia todo o estado relacionado ao usuário logado:
 *   - user: perfil completo (incluindo uiTheme para sincronização de tema)
 *   - tokens: access + refresh JWT
 *   - isLocked: estado do lock screen (persistido no localStorage)
 *   - requiresPasswordReset: flag de troca obrigatória de senha
 *
 * Persistência:
 *   - Sessão: localStorage["plantelligence-session"] (não inclui isLocked)
 *   - Lock: localStorage["plantelligence-lock"] (separado para segurança)
 *
 * Ao fazer login (setSession), aplica automaticamente o tema do servidor
 * via applyServerTheme(user.uiTheme) — sincroniza entre dispositivos.
 */

import { create } from 'zustand';
import { applyServerTheme } from './themeStore.js';

const STORAGE_KEY = 'plantelligence-session';

const normalizeTokens = (tokens) => {
  if (!tokens || typeof tokens !== 'object') {
    return null;
  }

  const accessToken = tokens.accessToken ?? tokens.access_token ?? null;
  const refreshToken = tokens.refreshToken ?? tokens.refresh_token ?? null;
  const accessJti = tokens.accessJti ?? tokens.access_jti ?? null;

  if (!accessToken && !refreshToken) {
    return null;
  }

  return {
    ...tokens,
    accessToken,
    refreshToken,
    accessJti
  };
};

const normalizeSession = (session) => {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const tokens = normalizeTokens(session.tokens);
  if (session.user && !tokens) {
    return {
      user: null,
      tokens: null,
      requiresPasswordReset: false
    };
  }

  return {
    user: session.user ?? null,
    tokens,
    requiresPasswordReset: Boolean(session.requiresPasswordReset)
  };
};

// mantém o login entre recargas
const loadFromStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const normalized = normalizeSession(JSON.parse(raw));
    if (!normalized?.user && !normalized?.tokens) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return normalized;
  } catch (error) {
    console.error('Failed to parse stored session', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const persistToStorage = (state) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const initialState = loadFromStorage() ?? {
  user: null,
  tokens: null,
  requiresPasswordReset: false,
};

// isLocked e persistido em chave separada do localStorage.
// Um refresh nao deve ignorar o bloqueio por inatividade —
// isso permitiria contornar o lock screen simplesmente atualizando a pagina.
const LOCK_KEY = 'plantelligence-lock';

const loadLockState = () => {
  if (typeof window === 'undefined') return { isLocked: false, lockReason: null };
  try {
    const raw = window.localStorage.getItem(LOCK_KEY);
    if (!raw) return { isLocked: false, lockReason: null };
    const parsed = JSON.parse(raw);
    return { isLocked: Boolean(parsed.isLocked), lockReason: parsed.lockReason || null };
  } catch {
    return { isLocked: false, lockReason: null };
  }
};

const persistLockState = (isLocked, lockReason) => {
  if (typeof window === 'undefined') return;
  if (isLocked) {
    window.localStorage.setItem(LOCK_KEY, JSON.stringify({ isLocked, lockReason }));
  } else {
    window.localStorage.removeItem(LOCK_KEY);
  }
};

const initialLockState = loadLockState();

export const useAuthStore = create((set, get) => ({
  ...initialState,
  ...initialLockState,

  // ── Sessao ────────────────────────────────────────────────────────────────

  setSession: ({ user, tokens, requiresPasswordReset }) => {
    const normalizedTokens = normalizeTokens(tokens);
    const nextState = {
      user,
      tokens: normalizedTokens,
      requiresPasswordReset:
        requiresPasswordReset ?? get().requiresPasswordReset ?? false,
      // ao receber nova sessao, remove o lock
      isLocked: false,
      lockReason: null,
    };
    set(nextState);
    persistLockState(false, null);
    // Aplica o tema salvo no perfil do servidor
    if (user?.uiTheme) {
      try { applyServerTheme(user.uiTheme); } catch {} 
    }
    persistToStorage({ user: nextState.user, tokens: nextState.tokens, requiresPasswordReset: nextState.requiresPasswordReset });
  },

  updateUser: (user) => {
    const state = get();
    const nextState = { ...state, user };
    set(nextState);
    persistToStorage({ user: nextState.user, tokens: nextState.tokens, requiresPasswordReset: nextState.requiresPasswordReset });
  },

  setRequiresPasswordReset: (flag) => {
    const state = get();
    const nextState = { ...state, requiresPasswordReset: flag };
    set(nextState);
    persistToStorage({ user: nextState.user, tokens: nextState.tokens, requiresPasswordReset: nextState.requiresPasswordReset });
  },

  clearSession: () => {
    set({ user: null, tokens: null, requiresPasswordReset: false, isLocked: false, lockReason: null });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LOCK_KEY);
    }
  },

  lockSession: (reason = 'idle') => {
    const state = get();
    if (!state.user || !state.tokens) return;
    set({ isLocked: true, lockReason: reason });
    persistLockState(true, reason);
  },

  unlockSession: () => {
    set({ isLocked: false, lockReason: null });
    persistLockState(false, null);
  },
}));
