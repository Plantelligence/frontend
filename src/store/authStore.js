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

// create: função do Zustand para criar a store de estado global
import { create } from 'zustand';
// applyServerTheme: aplica o tema vindo do perfil do banco após o login
import { applyServerTheme } from './themeStore.js';
// clearLastActivity: limpa o timestamp de inatividade ao fazer logout ou desbloquear
import { clearLastActivity } from '../hooks/useIdleTimer.js';

// Chave usada para persistir sessão no localStorage (não inclui o refresh token)
const STORAGE_KEY = 'plantelligence-session';

// Garante que o objeto de tokens só contenha o access token — nunca o refresh token
const normalizeTokens = (tokens) => {
  if (!tokens || typeof tokens !== 'object') {
    return null;
  }

  // Suporta os dois formatos de chave retornados pelo backend (camelCase e snake_case)
  const accessToken = tokens.accessToken ?? tokens.access_token ?? null;
  const accessJti = tokens.accessJti ?? tokens.access_jti ?? null;

  // Refresh token nao e mais armazenado — fica no httpOnly cookie (B3.6)
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    // Data de expiração do access token para uso futuro em lógicas de UI
    accessExpiresAt: tokens.accessExpiresAt ?? tokens.access_expires_at ?? null,
    // JTI (JWT ID) é usado na requisição de logout para invalidar o token no servidor
    accessJti,
  };
};

// Valida e normaliza o objeto de sessão lido do localStorage ou retornado pelo servidor
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
    // Boolean explícito para evitar valores truthy indesejados vindos do JSON
    requiresPasswordReset: Boolean(session.requiresPasswordReset)
  };
};

// mantém o login entre recargas: lê a sessão do localStorage ao inicializar o app
const loadFromStorage = () => {
  // Evita erro em SSR ou ambientes sem window (ex.: testes Node.js)
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const normalized = normalizeSession(JSON.parse(raw));
    // Se a sessão persistida não tiver usuário nem token, limpa e retorna null
    if (!normalized?.user && !normalized?.tokens) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return normalized;
  } catch (error) {
    // Se o JSON estiver corrompido, limpa e recomeça
    console.error('Failed to parse stored session', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

// Salva a sessão atual no localStorage, garantindo que o refresh token não seja incluído
const persistToStorage = (state) => {
  if (typeof window === 'undefined') {
    return;
  }
  // Garante que o refreshToken nunca seja persistido no localStorage (B3.6)
  const { tokens, ...rest } = state;
  // Extrai apenas os campos seguros do token — sem refresh token
  const safeTokens = tokens
    ? { accessToken: tokens.accessToken, accessExpiresAt: tokens.accessExpiresAt, accessJti: tokens.accessJti }
    : null;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, tokens: safeTokens }));
};

// Estado inicial: tenta restaurar a sessão do localStorage ou começa com estado vazio
const initialState = loadFromStorage() ?? {
  user: null,
  tokens: null,
  requiresPasswordReset: false,
};

// isLocked e persistido em chave separada do localStorage.
// Um refresh nao deve ignorar o bloqueio por inatividade —
// isso permitiria contornar o lock screen simplesmente atualizando a pagina.
const LOCK_KEY = 'plantelligence-lock';

// Lê o estado de bloqueio da sessão (lock screen) do localStorage
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

// Persiste ou remove o estado de bloqueio no localStorage
const persistLockState = (isLocked, lockReason) => {
  if (typeof window === 'undefined') return;
  if (isLocked) {
    // Salva o bloqueio para sobreviver a um refresh de página
    window.localStorage.setItem(LOCK_KEY, JSON.stringify({ isLocked, lockReason }));
  } else {
    // Remove o registro de bloqueio ao desbloquear
    window.localStorage.removeItem(LOCK_KEY);
  }
};

// Lê o estado de lock inicial na montagem — determina se o lock screen deve aparecer
const initialLockState = loadLockState();

// Cria a store Zustand com todos os estados e ações de autenticação
export const useAuthStore = create((set, get) => ({
  // Expande o estado inicial da sessão (user, tokens, requiresPasswordReset)
  ...initialState,
  // Expande o estado inicial do lock (isLocked, lockReason)
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
      // Preserva o flag de reset obrigatório de senha se não vier na resposta
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
    // Persiste a sessão atualizada (sem o refresh token)
    persistToStorage({ user: nextState.user, tokens: nextState.tokens, requiresPasswordReset: nextState.requiresPasswordReset });
  },

  // Atualiza apenas o objeto do usuário (ex.: após salvar preferências no perfil)
  updateUser: (user) => {
    const state = get();
    const nextState = { ...state, user };
    set(nextState);
    persistToStorage({ user: nextState.user, tokens: nextState.tokens, requiresPasswordReset: nextState.requiresPasswordReset });
  },

  // Define se o usuário deve ser forçado a trocar a senha no próximo acesso
  setRequiresPasswordReset: (flag) => {
    const state = get();
    const nextState = { ...state, requiresPasswordReset: flag };
    set(nextState);
    persistToStorage({ user: nextState.user, tokens: nextState.tokens, requiresPasswordReset: nextState.requiresPasswordReset });
  },

  // Limpa toda a sessão: zera estado, remove do localStorage e apaga o timestamp de inatividade
  clearSession: () => {
    set({ user: null, tokens: null, requiresPasswordReset: false, isLocked: false, lockReason: null });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LOCK_KEY);
    }
    // Limpa o timestamp do idle timer para não ativar o lock em sessão futura
    clearLastActivity();
  },

  // Bloqueia a sessão por inatividade ou outra razão — mantém o JWT válido
  lockSession: (reason = 'idle') => {
    const state = get();
    // Só bloqueia se houver sessão ativa (usuário logado com token)
    if (!state.user || !state.tokens) return;
    set({ isLocked: true, lockReason: reason });
    // Persiste o lock para que um refresh de página não desbloqueie automaticamente
    persistLockState(true, reason);
  },

  // Desbloqueia a sessão após verificação de senha pelo LockScreen
  unlockSession: () => {
    set({ isLocked: false, lockReason: null });
    persistLockState(false, null);
    // Reinicia o contador de inatividade a partir do desbloqueio
    clearLastActivity();
  },
}));
