/**
 * API simulada para desenvolvimento local sem backend.
 * Ativado quando VITE_MOCK=true no .env.local
 *
 * Substitui o adaptador do axios — todas as chamadas são interceptadas
 * e retornam dados simulados com latência realista.
 */
import api from './client.js';

/* ── Dados base ─────────────────────────────────────────── */

export const MOCK_USER_ADMIN = {
  id: 'mock-user-admin',
  email: 'demo@plantelligence.com',
  fullName: 'Administrador Demo',
  role: 'Admin',
  phone: '(11) 99999-0000',
  consentGiven: true,
  lastLoginAt: new Date().toISOString(),
  passwordExpiresAt: '2026-12-31',
  deletionRequested: false,
  mfa: {
    email: { configuredAt: '2026-01-01T00:00:00.000Z' },
    otp: { configuredAt: '2026-01-15T00:00:00.000Z' }
  }
};

export const MOCK_TOKENS = {
  accessToken: 'mock-access-token-dev',
  refreshToken: 'mock-refresh-token-dev',
  accessJti: 'mock-jti-dev'
};

const mockProfiles = [
  {
    id: 'shiitake-01',
    name: 'Shiitake',
    temperature: { min: 18, max: 24 },
    humidity: { min: 70, max: 90 },
    co2: { max: 1000 },
    soilMoisture: { min: 55, max: 75 }
  },
  {
    id: 'shimeji-01',
    name: 'Shimeji',
    temperature: { min: 14, max: 22 },
    humidity: { min: 80, max: 95 },
    co2: { max: 800 },
    soilMoisture: { min: 60, max: 80 }
  },
  {
    id: 'champignon-01',
    name: 'Champignon',
    temperature: { min: 16, max: 20 },
    humidity: { min: 75, max: 85 },
    co2: { max: 1000 },
    soilMoisture: { min: 50, max: 70 }
  }
];

const mockUserOperador = {
  id: 'mock-user-02',
  email: 'operador@plantelligence.com',
  fullName: 'Operador Demo',
  role: 'User',
  phone: '(11) 88888-0000',
  consentGiven: true,
  lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
  passwordExpiresAt: '2026-12-31',
  deletionRequested: false,
  mfa: { email: { configuredAt: '2026-01-01T00:00:00.000Z' } }
};

/* Estado mutável em memória — sobrevive apenas à sessão do servidor de desenvolvimento */
let currentUser = { ...MOCK_USER_ADMIN };
const mockUsersDb = [{ ...MOCK_USER_ADMIN }, { ...mockUserOperador }];

let greenhousesDb = [
  {
    id: 'gh-demo-01',
    name: 'Estufa Shiitake A',
    flowerProfileId: 'shiitake-01',
    alertsEnabled: true,
    profile: mockProfiles[0],
    watchersDetails: [mockUserOperador]
  },
  {
    id: 'gh-demo-02',
    name: 'Estufa Shimeji B',
    flowerProfileId: 'shimeji-01',
    alertsEnabled: false,
    profile: mockProfiles[1],
    watchersDetails: []
  }
];

const mockLogs = [
  {
    id: 'log-01',
    action: 'LOGIN_SUCCESS',
    userId: 'mock-user-admin',
    createdAt: new Date().toISOString(),
    hash: 'a1b2c3d4e5f6a1b2c3d4e5f6',
    prevHash: '000000000000000000000000',
    metadata: { ip: '127.0.0.1', userAgent: 'Chrome Mock' }
  },
  {
    id: 'log-02',
    action: 'MFA_VERIFIED',
    userId: 'mock-user-admin',
    createdAt: new Date(Date.now() - 60000).toISOString(),
    hash: 'b2c3d4e5f6a1b2c3d4e5f6a1',
    prevHash: 'a1b2c3d4e5f6a1b2c3d4e5f6',
    metadata: { method: 'otp' }
  },
  {
    id: 'log-03',
    action: 'GREENHOUSE_HEAT_ALERT',
    userId: 'mock-user-admin',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    hash: 'c3d4e5f6a1b2c3d4e5f6a1b2',
    prevHash: 'b2c3d4e5f6a1b2c3d4e5f6a1',
    metadata: { greenhouseId: 'gh-demo-01', metric: 'temperature', value: 27.2 }
  },
  {
    id: 'log-04',
    action: 'PASSWORD_CHANGED',
    userId: 'mock-user-02',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    hash: 'd4e5f6a1b2c3d4e5f6a1b2c3',
    prevHash: 'c3d4e5f6a1b2c3d4e5f6a1b2',
    metadata: {}
  }
];

/* ── Roteador simulado ──────────────────────────────────── */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const match = (config, method, pattern) => {
  const methodOk = (config.method ?? 'get').toLowerCase() === method;
  const urlOk = typeof pattern === 'string'
    ? config.url === pattern
    : pattern.test(config.url ?? '');
  return methodOk && urlOk;
};

const body = (config) => {
  try { return JSON.parse(config.data ?? '{}'); } catch { return {}; }
};

const getMockResponse = (config) => {
  const url = config.url ?? '';

  /* autenticação */
  if (match(config, 'post', '/auth/login'))
    return {
      mfaRequired: true,
      sessionId: 'mock-session-id-dev',
      methods: {
        email: { configuredAt: '2026-01-01T00:00:00.000Z' },
        otp: { configuredAt: '2026-01-15T00:00:00.000Z', enrollmentRequired: false }
      }
    };

  if (match(config, 'post', '/auth/mfa/initiate'))
    return { configured: true, debugCode: '123456', accountName: 'demo@plantelligence.com' };

  if (match(config, 'post', '/auth/mfa/verify'))
    return { user: currentUser, tokens: MOCK_TOKENS };

  if (match(config, 'post', '/auth/logout'))
    return {};

  if (match(config, 'post', '/auth/refresh'))
    return { user: currentUser, tokens: MOCK_TOKENS };

  if (match(config, 'post', '/auth/password-reset/request'))
    return {
      message: 'Se o e-mail existir, enviaremos instruções (mock).',
      mock: { token: 'mock-reset-token-abc123', resetLink: '/password-reset?token=mock-reset-token-abc123' }
    };

  if (match(config, 'post', '/auth/password-reset/confirm'))
    return { message: 'Senha redefinida com sucesso (mock).' };

  if (match(config, 'post', '/auth/register'))
    return { challengeId: 'mock-challenge-id', debugCode: '654321' };

  if (match(config, 'post', '/auth/register/confirm'))
    return {
      nextStep: 'otp',
      otpSetupId: 'mock-otp-setup-id',
      secret: 'MOCKSECRETKEY1234',
      accountName: 'demo@plantelligence.com',
      issuer: 'Plantelligence',
      debugCode: '111111'
    };

  if (match(config, 'post', '/auth/register/otp'))
    return { message: 'Cadastro concluído (mock). Redirecionando...' };

  /* usuário autenticado */
  if (match(config, 'get', '/users/me'))
    return { user: { ...currentUser } };

  if (match(config, 'put', '/users/me')) {
    const data = body(config);
    currentUser = { ...currentUser, ...data };
    return { user: { ...currentUser } };
  }

  if (match(config, 'post', '/users/change-password/challenge'))
    return {
      challengeId: 'mock-pwd-challenge',
      expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
      debugCode: '999999'
    };

  if (match(config, 'post', '/users/change-password'))
    return { message: 'Senha alterada com sucesso (mock).' };

  if (match(config, 'post', '/users/deletion-request'))
    return { message: 'Solicitação de exclusão registrada (mock).' };

  if (match(config, 'post', '/users/me/mfa/otp/start'))
    return {
      enrollmentId: 'mock-enrollment-id',
      secret: 'MOCKOTP123SECRET',
      accountName: 'demo@plantelligence.com',
      issuer: 'Plantelligence',
      uri: 'otpauth://totp/Plantelligence:demo%40plantelligence.com?secret=MOCKOTP123SECRET&issuer=Plantelligence',
      debugCode: '777777'
    };

  if (match(config, 'post', '/users/me/mfa/otp/confirm'))
    return { user: { ...currentUser, mfa: { ...currentUser.mfa, otp: { configuredAt: new Date().toISOString() } } } };

  if (match(config, 'get', '/users/logs'))
    return { logs: mockLogs };

  /* estufas — ordem importa: rotas mais específicas primeiro */
  if (match(config, 'get', '/greenhouse/recommendations'))
    return { profiles: mockProfiles };

  if (match(config, 'get', '/greenhouse'))
    return { greenhouses: greenhousesDb };

  if (match(config, 'post', '/greenhouse')) {
    const data = body(config);
    const profile = mockProfiles.find((p) => p.id === data.flowerProfileId) ?? null;
    const newGh = {
      id: `gh-demo-${Date.now()}`,
      name: data.name ?? 'Nova Estufa',
      flowerProfileId: data.flowerProfileId ?? null,
      alertsEnabled: false,
      profile,
      watchersDetails: []
    };
    greenhousesDb = [...greenhousesDb, newGh];
    return { greenhouse: newGh, greenhouses: greenhousesDb };
  }

  const ghAlerts = url.match(/^\/greenhouse\/([^/]+)\/alerts$/);
  if (ghAlerts && (config.method ?? '').toLowerCase() === 'patch') {
    const ghId = ghAlerts[1];
    const data = body(config);
    greenhousesDb = greenhousesDb.map((gh) =>
      gh.id === ghId ? { ...gh, alertsEnabled: data.alertsEnabled } : gh
    );
    return { greenhouse: greenhousesDb.find((gh) => gh.id === ghId) };
  }

  const ghEvaluate = url.match(/^\/greenhouse\/([^/]+)\/evaluate$/);
  if (ghEvaluate && (config.method ?? '').toLowerCase() === 'post') {
    const data = body(config);
    const metrics = data.metrics ?? {};
    return {
      status: 'ok',
      alerts: [],
      metricsEvaluation: {
        temperature:  { ok: true, value: metrics.temperature  ?? 24.6, expected: { min: 18, max: 24 } },
        humidity:     { ok: true, value: metrics.humidity     ?? 72,   expected: { min: 70, max: 90 } },
        soilMoisture: { ok: true, value: metrics.soilMoisture ?? 58,   expected: { min: 55, max: 75 } }
      },
      notified: data.notify === true,
      throttled: false
    };
  }

  const ghById = url.match(/^\/greenhouse\/([^/]+)$/);
  if (ghById) {
    const ghId = ghById[1];
    const method = (config.method ?? '').toLowerCase();
    if (method === 'put') {
      const data = body(config);
      const profile = mockProfiles.find((p) => p.id === data.flowerProfileId) ?? null;
      greenhousesDb = greenhousesDb.map((gh) =>
        gh.id === ghId ? { ...gh, ...data, profile } : gh
      );
      return { greenhouse: greenhousesDb.find((gh) => gh.id === ghId) };
    }
    if (method === 'delete') {
      greenhousesDb = greenhousesDb.filter((gh) => gh.id !== ghId);
      return { greenhouses: greenhousesDb };
    }
  }

  /* administração */
  if (match(config, 'get', '/admin/users'))
    return { users: mockUsersDb };

  const adminRole = url.match(/^\/admin\/users\/([^/]+)\/role$/);
  if (adminRole && (config.method ?? '').toLowerCase() === 'put') {
    const userId = adminRole[1];
    const data = body(config);
    const idx = mockUsersDb.findIndex((u) => u.id === userId);
    if (idx >= 0) mockUsersDb[idx] = { ...mockUsersDb[idx], role: data.role };
    return { user: mockUsersDb[idx] };
  }

  const adminGhTeam = url.match(/^\/admin\/greenhouse\/([^/]+)\/team$/);
  if (adminGhTeam && (config.method ?? '').toLowerCase() === 'put')
    return { config: null };

  const adminGh = url.match(/^\/admin\/greenhouse\/([^/]+)$/);
  if (adminGh && (config.method ?? '').toLowerCase() === 'get')
    return { config: null };

  return null;
};

/* ── Instala o adaptador simulado ───────────────────────── */

export const setupMocks = () => {
  api.defaults.adapter = async (config) => {
    await delay(100 + Math.random() * 150); // latência simulada 100–250ms

    const data = getMockResponse(config);

    if (data === null) {
      console.warn(`[MOCK] Rota não mapeada: ${(config.method ?? 'GET').toUpperCase()} ${config.url}`);
      const err = Object.assign(new Error(`Rota mock não encontrada: ${config.url}`), {
        config,
        response: { status: 404, data: { message: 'Rota mock não encontrada.' }, config }
      });
      return Promise.reject(err);
    }

    return { data, status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, config };
  };

  console.info('%c[Plantelligence Mock] Modo mock ativo — API simulada localmente.', 'color:#ef4444;font-weight:bold');
};
