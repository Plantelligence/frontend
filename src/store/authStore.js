/**
 * authStore.js - Estado global de autenticação (Zustand).
 *
 * Gerencia todo o estado relacionado ao usuário logado:
 *   - user: perfil completo (incluindo uiTheme para sincronização de tema)
 *   - tokens: apenas access token (o refresh token fica em httpOnly cookie — B3.6)
 *   - isLocked: estado do lock screen (persistido no localStorage)
 *   - requiresPasswordReset: flag de troca obrigatória de senha
 *
 * Persistência:
 *   - Sessão: localStorage["plantelligence-session"] (user + accessToken, sem refreshToken)
 *   - Lock: localStorage["plantelligence-lock"] (separado para segurança)
 *
 * O refresh token NÃO é salvo no localStorage — fica exclusivamente no cookie
 * httpOnly "plnt_rt", inacessível ao JavaScript (proteção contra XSS).
 *
 * Ao fazer login (setSession), aplica automaticamente o tema do servidor
 * via applyServerTheme(user.uiTheme) — sincroniza entre dispositivos.
 */

import { create } from 'zustand';
import { applyServerTheme } from './themeStore.js';
import { clearLastActivity } from '../hooks/useIdleTimer.js';

const STORAGE_KEY = 'plantelligence-session';

const normalizeTokens = (tokens) => {
  if (!tokens || typeof tokens !== 'object') {
    return null;
  }

  const accessToken = tokens.accessToken ?? tokens.access_token ?? null;
  const accessJti = tokens.accessJti ?? tokens.access_jti ?? null;

  // Refresh token nao e mais armazenado — fica no httpOnly cookie (B3.6)
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    accessExpiresAt: tokens.accessExpiresAt ?? tokens.access_expires_at ?? null,
    accessJti,
  };
};

const normalizeSession = (session) => {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const tokens = normalizeTokens(session.tokens);
  // Sem user e sem access token, sessao invalida
  if (!session.user && !tokens) {
    return null;
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
  // Garante que o refreshToken nunca seja persistido no localStorage (B3.6)
  const { tokens, ...rest } = state;
  const safeTokens = tokens
    ? { accessToken: tokens.accessToken, accessExpiresAt: tokens.accessExpiresAt, accessJti: tokens.accessJti }
    : null;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, tokens: safeTokens }));
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
    // Detecta se já havia sessão ativa (= refresh de token, não login fresco)
    const current = get();
    const isTokenRefresh = Boolean(current.user);
    const normalizedTokens = normalizeTokens(tokens);

    // Em refresh de token (recarga de página, renovação silenciosa), preserva
    // o estado de lock existente para que o LockScreen não desapareça.
    // Apenas login fresco (isTokenRefresh = false) limpa o lock.
    const nextLocked    = isTokenRefresh ? current.isLocked    : false;
    const nextLockReason = isTokenRefresh ? current.lockReason : null;

    const nextState = {
      user,
      tokens: normalizedTokens,
      requiresPasswordReset:
        requiresPasswordReset ?? current.requiresPasswordReset ?? false,
      isLocked:    nextLocked,
      lockReason:  nextLockReason,
    };
    set(nextState);

    // Só apaga o lock no localStorage em login fresco
    if (!isTokenRefresh) persistLockState(false, null);

    // Aplica o tema do servidor apenas em login fresco.
    // Regra: servidor 'dark' sempre prevalece (usuário habilitou em outro dispositivo).
    //        Servidor 'light' só prevalece se não houver preferência local salva —
    //        evita sobrescrever o dark mode local quando o PATCH de preferência
    //        ainda não chegou ao servidor (race condition ou falha silenciosa).
    if (user?.uiTheme && !isTokenRefresh) {
      try {
        const localTheme = window.localStorage.getItem('plantelligence-theme');
        if (user.uiTheme === 'dark' || !localTheme) {
          applyServerTheme(user.uiTheme);
        }
      } catch {}
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
    clearLastActivity();
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
    // Reinicia o contador de inatividade a partir do desbloqueio
    clearLastActivity();
  },
}));
