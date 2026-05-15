/**
 * Serviço de autenticação — registro, login, MFA e recuperação de senha.
 *
 * Fluxo de registro:
 *   register → confirmRegistration (valida e-mail) → finalizeRegistration (OTP)
 *
 * Fluxo de login padrão:
 *   login → (se MFA ativo) initiateMfa → verifyMfa
 *
 * Fluxo de primeiro acesso (usuário convidado):
 *   startFirstAccess → completeFirstAccess
 *
 * O token JWT é gerenciado pelo authStore — este serviço só faz as chamadas HTTP.
 * A renovação automática do token acontece no interceptor em client.js.
 */

import api from './client.js';

export const register = (payload) =>
  api.post('/auth/register', payload).then((res) => res.data);

export const confirmRegistration = (payload) =>
  api.post('/auth/register/confirm', payload).then((res) => res.data);

// finaliza o registro confirmando o código OTP enviado por e-mail
export const finalizeRegistration = (payload) =>
  api.post('/auth/register/otp', payload).then((res) => res.data);

export const login = (payload) =>
  api.post('/auth/login', payload).then((res) => res.data);

// inicia o desafio MFA após login com senha (retorna o tipo de fator configurado)
export const initiateMfa = (payload) =>
  api.post('/auth/mfa/initiate', payload).then((res) => res.data);

// verifica o código MFA e conclui o login, retornando os tokens de sessão
export const verifyMfa = (payload) =>
  api.post('/auth/mfa/verify', payload).then((res) => res.data);

export const refresh = (payload) =>
  api.post('/auth/refresh', payload).then((res) => res.data);

export const logout = (payload) =>
  api.post('/auth/logout', payload).then((res) => res.status);

export const requestPasswordReset = (payload) =>
  api.post('/auth/password-reset/request', payload).then((res) => res.data);

export const confirmPasswordReset = (payload) =>
  api.post('/auth/password-reset/confirm', payload).then((res) => res.data);

// fluxo de primeiro acesso para usuários convidados (sem senha definida)
export const startFirstAccess = (payload) =>
  api.post('/auth/first-access/start', payload).then((res) => res.data);

export const completeFirstAccess = (payload) =>
  api.post('/auth/first-access/complete', payload).then((res) => res.data);
