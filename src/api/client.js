import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const resolveBaseUrl = () => {
  const raw = (import.meta.env?.VITE_APP_API_URL ?? '').trim();
  if (!raw) return '/api';
  if (raw === '/api') return '/api';
  if (raw.startsWith('http')) {
    // Força https para URLs não-locais (produção é sempre HTTPS)
    const isLocal = /localhost|127\.0\.0\.1/.test(raw);
    const secured = isLocal ? raw : raw.replace(/^http:\/\//i, 'https://');
    const cleaned = secured.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }
  return raw.replace(/\/+$/, '') || '/api';
};

const configuredBaseUrl = resolveBaseUrl();
const REQUEST_TIMEOUT_MS = Number.parseInt(import.meta.env?.VITE_APP_API_TIMEOUT_MS ?? '15000', 10);
const resolvedTimeout = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0 ? REQUEST_TIMEOUT_MS : 15000;

const api = axios.create({ baseURL: configuredBaseUrl, timeout: resolvedTimeout });
const refreshClient = axios.create({ baseURL: configuredBaseUrl, timeout: resolvedTimeout });
let refreshPromise = null;

const getAccessToken  = (t) => t?.accessToken  ?? t?.access_token  ?? null;
const getRefreshToken = (t) => t?.refreshToken ?? t?.refresh_token ?? null;

const isAuthEndpoint = (url = '') => {
  const n = String(url || '').toLowerCase();
  return n.includes('/auth/login') || n.includes('/auth/register') ||
         n.includes('/auth/mfa/') || n.includes('/auth/password-reset') ||
         n.includes('/auth/first-access') || n.includes('/auth/refresh');
};

export const refreshSession = async () => {
  if (!refreshPromise) {
    const { tokens, setSession, clearSession } = useAuthStore.getState();
    const refreshToken = getRefreshToken(tokens);
    if (!refreshToken) { clearSession(); throw new Error('Refresh token not available'); }
    if (api.defaults.adapter) refreshClient.defaults.adapter = api.defaults.adapter;

    refreshPromise = refreshClient
      .post('/auth/refresh', { refreshToken })
      .then((res) => {
        const p = res.data;
        setSession({ user: p.user, tokens: p.tokens });
        const next = getAccessToken(p.tokens);
        if (!next) { clearSession(); throw new Error('Access token not returned'); }
        return next;
      })
      .catch((err) => {
        const status = err?.response?.status;
        const detail = err?.response?.data?.message || err?.response?.data?.detail || '';
        if (detail === 'SESSION_MAX_AGE_EXCEEDED') {
          clearSession();
          if (typeof window !== 'undefined') window.location.href = '/login?reason=session_expired';
        } else if (status === 401 || status === 403) {
          clearSession();
        }
        throw err;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const { tokens } = useAuthStore.getState();
  const token = getAccessToken(tokens);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Garante HTTPS em produção: evita Mixed Content se a URL absoluta vier com http://
  if (config.url && config.url.startsWith('http://')) {
    const isLocal = /localhost|127\.0\.0\.1/.test(config.url);
    if (!isLocal) config.url = config.url.replace(/^http:\/\//i, 'https://');
  }
  if (config.baseURL && config.baseURL.startsWith('http://')) {
    const isLocal = /localhost|127\.0\.0\.1/.test(config.baseURL);
    if (!isLocal) config.baseURL = config.baseURL.replace(/^http:\/\//i, 'https://');
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.message === 'MFA_RECONFIRMATION_REQUIRED') {
      useAuthStore.getState().clearSession();
      if (typeof window !== 'undefined') window.location.href = '/login?reason=mfa_required_for_action';
      return Promise.reject(error);
    }
    const orig = error.config;
    const { tokens } = useAuthStore.getState();
    const shouldRefresh = Boolean(getRefreshToken(tokens)) && orig &&
      error.response?.status === 401 && !orig._retry && !isAuthEndpoint(orig.url);
    if (shouldRefresh) {
      orig._retry = true;
      try {
        const newToken = await refreshSession();
        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch (e) { return Promise.reject(e); }
    }
    return Promise.reject(error);
  }
);

export default api;
