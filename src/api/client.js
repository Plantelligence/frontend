/**
 * Cliente HTTP base — todas as requisições ao backend passam por aqui.
 *
 * Configuração automática:
 *   - Em produção, lê VITE_APP_API_URL e apenda /api ao final
 *   - Em desenvolvimento, o proxy do Vite (vite.config.js) redireciona /api
 *     para http://localhost:4001, então não precisa de URL absoluta
 *
 * Autenticação:
 *   O interceptor de requisição injeta o token JWT (accessToken) em cada
 *   chamada. Se o servidor responder 401, tenta renovar o token via /auth/refresh
 *   uma única vez antes de encerrar a sessão do usuário.
 *
 * Variáveis de ambiente usadas:
 *   VITE_APP_API_URL         — URL do backend em produção
 *   VITE_APP_API_TIMEOUT_MS  — timeout das requisições (padrão: 15000ms)
 */

import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// resolve a URL base do backend a partir da variável de ambiente
const resolveBaseUrl = () => {
  const raw = (import.meta.env?.VITE_APP_API_URL ?? '').trim();

  if (!raw) return '/api';
  if (raw === '/api') return '/api';

  if (raw.startsWith('http')) {
    const cleaned = raw.replace(/\/+$/, '');
    // evita duplicar "/api" se a URL já terminar com ele
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  return raw.replace(/\/+$/, '') || '/api';
};

const configuredBaseUrl = resolveBaseUrl();

const REQUEST_TIMEOUT_MS = Number.parseInt(import.meta.env?.VITE_APP_API_TIMEOUT_MS ?? '15000', 10);
const resolvedTimeout = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0
  ? REQUEST_TIMEOUT_MS
  : 15000;

// instância principal usada por todos os serviços
const api = axios.create({ baseURL: configuredBaseUrl, timeout: resolvedTimeout });

// instância separada para o refresh — evita loop infinito caso o próprio
// endpoint de refresh retorne 401
const refreshClient = axios.create({ baseURL: configuredBaseUrl, timeout: resolvedTimeout });

// lock para garantir que apenas um refresh rode por vez,
// mesmo que múltiplas requisições falhem com 401 simultaneamente
let refreshPromise = null;

const getAccessToken  = (tokens) => tokens?.accessToken  ?? tokens?.access_token  ?? null;
const getRefreshToken = (tokens) => tokens?.refreshToken ?? tokens?.refresh_token ?? null;

// rotas de autenticação não precisam do interceptor de refresh
const isAuthEndpoint = (url = '') => {
  const n = String(url || '').toLowerCase();
  return n.includes('/auth/login')
    || n.includes('/auth/register')
    || n.includes('/auth/mfa/')
    || n.includes('/auth/password-reset')
    || n.includes('/auth/first-access')
    || n.includes('/auth/refresh');
};

const refreshSession = async () => {
  if (!refreshPromise) {
    const { tokens, setSession, clearSession } = useAuthStore.getState();
    const refreshToken = getRefreshToken(tokens);

    if (!refreshToken) {
      clearSession();
      throw new Error('Refresh token not available');
    }

    if (api.defaults.adapter) {
      refreshClient.defaults.adapter = api.defaults.adapter;
    }

    refreshPromise = refreshClient
      .post('/auth/refresh', { refreshToken })
      .then((response) => {
        const payload = response.data;
        setSession({ user: payload.user, tokens: payload.tokens });
        const nextToken = getAccessToken(payload.tokens);
        if (!nextToken) {
          clearSession();
          throw new Error('Access token not returned by refresh endpoint');
        }
        return nextToken;
      })
      .catch((error) => {
        const status  = error?.response?.status;
        const detail  = error?.response?.data?.message || error?.response?.data?.detail || '';

        if (detail === 'SESSION_MAX_AGE_EXCEEDED') {
          // Sessão muito antiga — logout forçado com aviso
          clearSession();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?reason=session_expired';
          }
        } else if (status === 401 || status === 403) {
          // Falha de autenticação real — refresh token inválido/revogado
          clearSession();
        }
        // Erros de rede (sem status), 500, 503, timeout, CORS:
        // NÃO limpar sessão — pode ser indisponibilidade temporária do servidor.
        // O usuário tenta de novo e a sessão fica preservada.
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// injeta o Bearer token em cada requisição
api.interceptors.request.use((config) => {
  const { tokens } = useAuthStore.getState();
  const accessToken = getAccessToken(tokens);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// em 401, tenta renovar o token uma vez antes de deslogar
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Acao critica com sessao MFA expirada: forca novo login completo
    if (error.response?.status === 403 && error.response?.data?.message === 'MFA_RECONFIRMATION_REQUIRED') {
      useAuthStore.getState().clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=mfa_required_for_action';
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const { tokens } = useAuthStore.getState();

    const shouldTryRefresh = Boolean(getRefreshToken(tokens))
      && originalRequest
      && error.response?.status === 401
      && !originalRequest._retry
      && !isAuthEndpoint(originalRequest.url);

    if (shouldTryRefresh) {
      originalRequest._retry = true;
      try {
        const newAcce