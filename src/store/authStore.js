import { create } from 'zustand';

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
  requiresPasswordReset: false
};

export const useAuthStore = create((set, get) => ({
  ...initialState,
  setSession: ({ user, tokens, requiresPasswordReset }) => {
    const normalizedTokens = normalizeTokens(tokens);
    const nextState = {
      user,
      tokens: normalizedTokens,
      requiresPasswordReset:
        requiresPasswordReset ?? get().requiresPasswordReset ?? false
    };
    set(nextState);
    persistToStorage(nextState);
  },
  updateUser: (user) => {
    const state = get();
    const nextState = { ...state, user };
    set(nextState);
    persistToStorage(nextState);
  },
  setRequiresPasswordReset: (flag) => {
    const state = get();
    const nextState = { ...state, requiresPasswordReset: flag };
    set(nextState);
    persistToStorage(nextState);
  },
  clearSession: () => {
    set({ user: null, tokens: null, requiresPasswordReset: false });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}));
