import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// Força https em qualquer URL absoluta que não seja localhost — sem depender de window
const _toHttps = (url) => {
  // Se não houver URL ou não for string, devolve sem alterar
  if (!url || typeof url !== 'string') return url;
  // Localhost pode continuar em http durante o desenvolvimento
  if (/localhost|127\.0\.0\.1/.test(url)) return url;
  // Substitui http:// por https:// para garantir tráfego cifrado em produção
  // Também aplica se a página já estiver em https (defesa contra redirects do proxy)
  const pageIsHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (pageIsHttps || url.startsWith('http://')) {
    return url.replace(/^http:\/\//i, 'https://');
  }
  return url;
};

// Determina a URL base da API a partir da variável de ambiente VITE_APP_API_URL
const resolveBaseUrl = () => {
  // Lê e higieniza a variável de ambiente definida no .env
  const raw = _toHttps((import.meta.env?.VITE_APP_API_URL ?? '').trim());
  // Se não houver variável ou for apenas '/api', usa o proxy relativo do Vite
  if (!raw || raw === '/api') return '/api';
  // Se a URL for absoluta (https://...), garante que termina em /api
  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    const cleaned = raw.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }
  // URL relativa: remove barras finais ou cai para /api
  return raw.replace(/\/+$/, '') || '/api';
};

// Guarda a URL base resolvida para reaproveitamento
const configuredBaseUrl = resolveBaseUrl();
// Timeout lido do .env; se inválido ou zero, usa 15 segundos como padrão seguro
const REQUEST_TIMEOUT_MS = Number.parseInt(import.meta.env?.VITE_APP_API_TIMEOUT_MS ?? '15000', 10);
const resolvedTimeout = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0 ? REQUEST_TIMEOUT_MS : 15000;

// withCredentials = true envia o httpOnly cookie plnt_rt em chamadas cross-origin (B3.6)
// api: instância principal usada em toda a aplicação
const api = axios.create({ baseURL: configuredBaseUrl, timeout: resolvedTimeout, withCredentials: true });
// refreshClient: instância separada para renovar o token — evita loop infinito nos interceptores
const refreshClient = axios.create({ baseURL: configuredBaseUrl, timeout: resolvedTimeout, withCredentials: true });
// Variável que guarda a Promise de refresh em andamento para não disparar vários simultaneamente
let refreshPromise = null;

// Extrai o access token do objeto de tokens, suportando os dois formatos do backend
const getAccessToken = (t) => t?.accessToken ?? t?.access_token ?? null;

// Identifica endpoints de autenticação que não devem acionar a renovação automática de token
// /auth/unlock incluído: 401 ali significa senha errada, não token expirado
const isAuthEndpoint = (url = '') => {
  const n = String(url || '').toLowerCase();
  return n.includes('/auth/login') || n.includes('/auth/register') ||
         n.includes('/auth/mfa/') || n.includes('/auth/password-reset') ||
         n.includes('/auth/first-access') || n.includes('/auth/refresh') ||
         n.includes('/auth/unlock');
};

// Renova a sessão usando o refresh token que fica no cookie httpOnly plnt_rt
export const refreshSession = async () => {
  // Usa a Promise existente se já houver um refresh em andamento (evita requests duplicados)
  if (!refreshPromise) {
    const { user, setSession, clearSession } = useAuthStore.getState();
    // Sem usuário na store nao há sessão para renovar
    if (!user) { clearSession(); throw new Error('No active session'); }
    // Propaga o adapter customizado (útil em testes com MSW) para o refreshClient
    if (api.defaults.adapter) refreshClient.defaults.adapter = api.defaults.adapter;

    // Nao envia body — backend lê o refresh token do httpOnly cookie (B3.6)
    refreshPromise = refreshClient
      .post('/auth/refresh')
      .then((res) => {
        // Extrai dados da resposta e atualiza o estado global com o novo access token
        const p = res.data;
        setSession({ user: p.user, tokens: p.tokens });
        const next = getAccessToken(p.tokens);
        // Se o backend não retornou o token, a sessão está inválida
        if (!next) { clearSession(); throw new Error('Access token not returned'); }
        return next;
      })
      .catch((err) => {
        const status = err?.response?.status;
        const detail = err?.response?.data?.message || err?.response?.data?.detail || '';
        // Sessão ultrapassou o tempo máximo de vida (ex.: 30 dias) — força novo login
        if (detail === 'SESSION_MAX_AGE_EXCEEDED') {
          clearSession();
          if (typeof window !== 'undefined') window.location.href = '/login?reason=session_expired';
        // 401 ou 403 no refresh significa que o cookie expirou ou foi invalidado
        // Se a tela estiver bloqueada (isLocked), não limpa a sessão: o lock screen
        // já está visível e o usuário precisa desbloquear normalmente com a senha.
        } else if (status === 401 || status === 403) {
          const { isLocked } = useAuthStore.getState();
          if (!isLocked) clearSession();
        }
        throw err;
      })
      // Limpa o ponteiro após concluir (seja sucesso ou falha) para permitir novo refresh
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

// Interceptor de requisição: injeta o Bearer token em todos os requests autenticados
api.interceptors.request.use((config) => {
  // Pega o access token atual da store (armazenado em memória, não no localStorage)
  const { tokens } = useAuthStore.getState();
  const token = getAccessToken(tokens);
  // Adiciona o cabeçalho Authorization apenas se houver token válido
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Garante que URLs absolutas construídas dinamicamente também usem https
  if (config.url)     config.url     = _toHttps(config.url);
  if (config.baseURL) config.baseURL = _toHttps(config.baseURL);

  return config;
});

// Interceptor de resposta: captura erros e tenta renovar o token automaticamente
api.interceptors.response.use(
  // Resposta bem-sucedida: apenas repassa
  (res) => res,
  async (error) => {
    // Se o backend exige reconfirmação MFA para ação crítica, desloga e redireciona
    if (error.response?.status === 403 && error.response?.data?.message === 'MFA_RECONFIRMATION_REQUIRED') {
      useAuthStore.getState().clearSession();
      if (typeof window !== 'undefined') window.location.href = '/login?reason=mfa_required_for_action';
      return Promise.reject(error);
    }
    // Referência à configuração original da requisição que falhou
    const orig = error.config;
    const { user } = useAuthStore.getState();
    // Tenta renovar se há sessão ativa (cookie plnt_rt enviado automaticamente)
    // _retry evita loop: a requisição repetida com token novo não tenta renovar de novo
    const shouldRefresh = Boolean(user) && orig &&
      error.response?.status === 401 && !orig._retry && !isAuthEndpoint(orig.url);
    if (shouldRefresh) {
      // Marca como já tentada para não entrar em loop infinito
      orig._retry = true;
      try {
        // Renova o token e reenvia a requisição original com o novo Bearer
        const newToken = await refreshSession();
        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch (e) { return Promise.reject(e); }
    }
    return Promise.reject(error);
  }
);

export default api;
