// Testes de Integração — authService
//
// Verifica que cada função do serviço de autenticação chama o endpoint correto
// com o payload correto. O Axios é mockado para não fazer chamadas HTTP reais.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo client.js (Axios configurado)
vi.mock('../../api/client.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../../api/client.js';
import {
  login,
  logout,
  register,
  requestPasswordReset,
  confirmPasswordReset,
  verifyMfa,
  initiateMfa,
  refresh,
} from '../../api/authService.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService — login', () => {

  it('POST /auth/login com e-mail e senha', async () => {
    api.post.mockResolvedValueOnce({ data: { mfaRequired: true, sessionId: 'sess-1' } });

    const resultado = await login({ email: 'a@b.com', password: 'Senha@123' });

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'Senha@123' });
    expect(resultado.mfaRequired).toBe(true);
  });

  it('repassa o erro da API quando as credenciais são inválidas', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 401, data: { detail: 'Usuário ou senha incorretos.' } } });

    await expect(login({ email: 'x@y.com', password: 'errada' })).rejects.toBeTruthy();
  });

});

describe('authService — logout', () => {

  it('POST /auth/logout com refreshToken', async () => {
    api.post.mockResolvedValueOnce({ status: 204 });

    const resultado = await logout({ refreshToken: 'tok-abc' });

    expect(api.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'tok-abc' });
    expect(resultado).toBe(204);
  });

});

describe('authService — register', () => {

  it('POST /auth/register com os dados do formulário', async () => {
    const payload = { email: 'novo@planti.com', password: 'Forte@1', fullName: 'Maria' };
    api.post.mockResolvedValueOnce({ data: { challengeId: 'ch-1' } });

    const resultado = await register(payload);

    expect(api.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(resultado.challengeId).toBe('ch-1');
  });

});

describe('authService — MFA', () => {

  it('initiateMfa: POST /auth/mfa/initiate com sessionId', async () => {
    api.post.mockResolvedValueOnce({ data: { factorType: 'totp' } });

    await initiateMfa({ sessionId: 'sess-x' });

    expect(api.post).toHaveBeenCalledWith('/auth/mfa/initiate', { sessionId: 'sess-x' });
  });

  it('verifyMfa: POST /auth/mfa/verify com código OTP', async () => {
    api.post.mockResolvedValueOnce({ data: { accessToken: 'at', refreshToken: 'rt' } });

    const resultado = await verifyMfa({ sessionId: 'sess-x', code: '123456' });

    expect(api.post).toHaveBeenCalledWith('/auth/mfa/verify', { sessionId: 'sess-x', code: '123456' });
    expect(resultado.accessToken).toBe('at');
  });

});

describe('authService — recuperação de senha', () => {

  it('requestPasswordReset: POST /auth/password-reset/request', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'E-mail enviado.' } });

    await requestPasswordReset({ email: 'a@b.com' });

    expect(api.post).toHaveBeenCalledWith('/auth/password-reset/request', { email: 'a@b.com' });
  });

  it('confirmPasswordReset: POST /auth/password-reset/confirm com token e nova senha', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Senha redefinida.' } });

    await confirmPasswordReset({ token: 'tok-reset', password: 'Nova@Senha1' });

    expect(api.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
      token: 'tok-reset',
      password: 'Nova@Senha1',
    });
  });

});

describe('authService — refresh de sessão', () => {

  it('POST /auth/refresh com refreshToken', async () => {
    api.post.mockResolvedValueOnce({ data: { accessToken: 'novo-at' } });

    const resultado = await refresh({ refreshToken: 'rt-abc' });

    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'rt-abc' });
    expect(resultado.accessToken).toBe('novo-at');
  });

});
