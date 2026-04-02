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

const api = axios.create({
  baseURL: configuredBaseUrl
});

const refreshClient = axios.create({
  baseURL: configuredBaseUrl
});

let refreshPromise = null;

const refreshSession = async () => {
  if (!refreshPromise) {
    const { tokens, setSession, clearSession } = useAuthStore.getState();
    if (!tokens?.refreshToken) {
      clearSession();
      throw new Error('Refresh token not available');
    }

    if (api.defaults.adapter) {
      refreshClient.defaults.adapter = api.defaults.adapter;
    }

    refreshPromise = refreshClient
      .post('/auth/refresh', { refreshToken: tokens.refreshToken })
      .then((response) => {
        const payload = response.data;
        setSession({
          user: payload.user,
          tokens: payload.tokens
        });
        return payload.tokens.accessToken;
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
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest && error.response?.status === 401 && !originalRequest._retry) {
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
