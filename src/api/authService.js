import api from './client.js';

// Inicia o fluxo de cadastro com validacoes basicas no backend.
export const register = (payload) => api.post('/auth/register', payload).then((res) => res.data);

// Confirma o codigo recebido por e-mail no cadastro.
export const confirmRegistration = (payload) =>
  api.post('/auth/register/confirm', payload).then((res) => res.data);

// Finaliza o cadastro validando o OTP do autenticador.
export const finalizeRegistration = (payload) =>
  api.post('/auth/register/otp', payload).then((res) => res.data);

// Realiza login com e-mail e senha.
export const login = (payload) => api.post('/auth/login', payload).then((res) => res.data);

// Inicia o metodo de MFA escolhido (email ou otp).
export const initiateMfa = (payload) => api.post('/auth/mfa/initiate', payload).then((res) => res.data);

// Confirma o desafio MFA e retorna sessao autenticada.
export const verifyMfa = (payload) => api.post('/auth/mfa/verify', payload).then((res) => res.data);

// Renova o access token usando refresh token valido.
export const refresh = (payload) => api.post('/auth/refresh', payload).then((res) => res.data);

// Encerra a sessao atual no backend.
export const logout = (payload) => api.post('/auth/logout', payload).then((res) => res.status);

// Solicita token para redefinicao de senha.
export const requestPasswordReset = (payload) =>
  api.post('/auth/password-reset/request', payload).then((res) => res.data);

// Confirma nova senha com o token de recuperacao.
export const confirmPasswordReset = (payload) =>
  api.post('/auth/password-reset/confirm', payload).then((res) => res.data);
