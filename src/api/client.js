import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const resolveBaseUrl = () => {
  const raw = (import.meta.env?.VITE_APP_API_URL ?? '').trim();

  if (!raw) {
    return '/api';
  }

  if (raw === '/api') {
    return '/api';
  }

  if (raw.startsWith('http')) {
    const cleaned = raw.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  const cleaned = raw.replace(/\/+$/, '');
  return cleaned || '/api';
};

const configuredBaseUrl = resolveBaseUrl();
const REQUEST_TIMEOUT_MS = Number.parseInt(import.meta.env?.VITE_APP_API_TIMEOUT_MS ?? '15000', 10);
const resolvedTimeout = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0
  ? REQUEST_TIMEOUT_MS
  : 15000;

const api = axios.create({
  baseURL: configuredBaseUrl,
  timeout: resolvedTimeout
});

const refreshClient = axios.create({
  baseURL: configuredBaseUrl,
  timeout: resolvedTimeout
});

let refreshPromise = null;

const getAccessToken = (tokens) => tokens?.accessToken ?? tokens?.access_token ?? null;
const getRefreshToken = (tokens) => tokens?.refreshToken ?? tokens?.refresh_token ?? null;

const isAuthEndpoint = (url = '') => {
  const normalized = String(url || '').toLowerCase();
  return normalized.includes('/auth/login')
    || normalized.includes('/auth/register')
    || normalized.includes('/auth/mfa/')
    || normalized.includes('/auth/password-reset')
    || normalized.includes('/auth/first-access')
    || normalized.includes('/auth/refresh');
};

// trava para não disparar múltiplos refreshes simultâneos
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
        setSession({
          user: payload.user,
          tokens: payload.tokens
        });
        const nextAccessToken = getAccessToken(payload.tokens);
        if (!nextAccessToken) {
          clearSession();
          throw new Error('Access token not returned by refresh endpoint');
        }
        return nextAccessToken;
      })
      .catch((error) => {
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const { tokens } = useAuthStore.getState();
  const accessToken = getAccessToken(tokens);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401: tenta refresh uma única vez antes de deslogar
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
        const newAccessToken = await refreshSession();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
