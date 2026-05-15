/**
 * Serviço de perfil do usuário — dados pessoais, senha, MFA e exclusão de conta.
 *
 * Todas as funções operam sobre o usuário logado (/users/me).
 * Troca de senha requer um desafio de segurança antes (requestPasswordChangeChallenge)
 * para confirmar que é o dono da conta fazendo a alteração.
 */

import api from './client.js';

export const getProfile = () =>
  api.get('/users/me').then((res) => res.data);

export const updateProfile = (payload) =>
  api.put('/users/me', payload).then((res) => res.data);

// gera um desafio (código por e-mail ou MFA) antes de permitir troca de senha
export const requestPasswordChangeChallenge = () =>
  api.post('/users/change-password/challenge').then((res) => res.data);

export const changePassword = (payload) =>
  api.post('/users/change-password', payload).then((res) => res.data);

// solicitação de exclusão de dados conforme LGPD — não exclui imediatamente
export const requestDeletion = (payload) =>
  api.post('/users/deletion-request', payload).then((res) => res.data);

export const getSecurityLogs = (limit = 500) =>
  api.get('/users/logs', { params: { limit } }).then((res) => res.data);

// inicia o cadastro do app autenticador (retorna QR Code e chave TOTP)
export const startOtpEnrollment = () =>
  api.post('/users/me/mfa/otp/start').then((res) => res.data);

// confirma o código gerado pelo app para ativar o MFA na conta
export const confirmOtpEnrollment = (payload) =>
  api.post('/users/me/mfa/otp/confirm', payload).then((res) => res.data);
