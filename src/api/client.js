import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// Força https em qualquer URL absoluta que não seja localhost — sem depender de window
const _toHttps = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (/localhost|127\.0\.0\.1/.test(url)) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

const resolveBaseUrl = () => {
  const raw = _toHttps((import.meta.env?.VITE_APP_API_URL ?? '').trim());
  if (!raw || raw === '/api') return '/api';
  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    const cleaned = raw.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }
  return raw.replace(/\/+$/, '') || '/api';
};

const configuredBaseUrl = resolveBaseUrl();
const REQUEST_TIMEOUT_MS = Number.parseInt(import.meta.env?.VITE_APP_API_TIMEOUT_MS ?? '15000', 10);
const resolvedTimeout = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0 ? REQUEST_TIMEOUT_MS : 15000;

// withCredentials = true envia o httpOnly cookie plnt_rt em chamadas cross-origin (B3.6)
const api = axios.create({ baseURL: configuredBaseUrl, timeout: resolvedTimeout, withCredentials: true });
const refreshClient = axios.create({ baseURL: configuredBaseUrl, timeout: resolvedTimeout, withCredentials: true });
let refreshPromise = null;

const getAccessToken = (t) => t?.accessToken ?? t?.access_token ?? null;

const isAuthEndpoint = (url = '') => {
  const n = String(url || '').toLowerCase();
  return n.includes('/auth/login') || n.includes('/auth/register') ||
         n.includes('/auth/mfa/') || n.includes('/auth/password-reset') ||
         n.includes('/auth/first-access') || n.includes('/auth/refresh');
};

export const refreshSession = async () => {
  if (!refreshPromise) {
    const { user, setSession, clearSession } = useAuthStore.getState();
    // Sem usuário na store nao há sessão para renovar
    if (!user) { clearSession(); throw new Error('No active session'); }
    if (api.defaults.adapter) refreshClient.defaults.adapter = api.defaults.adapter;

    // Nao envia body — backend lê o refresh token do httpOnly cookie (B3.6)
    refreshPromise = refreshClient
      .post('/auth/refresh')
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

  if (config.url)     config.url     = _toHttps(config.url);
  if (config.baseURL) config.baseURL = _toHttps(config.baseURL);

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
    const { user } = useAuthStore.getState();
    // Tenta renovar se há sessão ativa (cookie plnt_rt enviado automaticamente)
    const shouldRefresh = Boolean(user) && orig &&
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
