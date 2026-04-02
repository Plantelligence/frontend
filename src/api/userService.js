import api from './client.js';

// Busca dados do usuario logado.
export const getProfile = () => api.get('/users/me').then((res) => res.data);

// Atualiza informacoes basicas do perfil.
export const updateProfile = (payload) => api.put('/users/me', payload).then((res) => res.data);

// Solicita troca de senha com validacao MFA.
export const changePassword = (payload) =>
  api.post('/users/change-password', payload).then((res) => res.data);

// Gera desafio de seguranca para alteracao de senha.
export const requestPasswordChangeChallenge = () =>
  api.post('/users/change-password/challenge').then((res) => res.data);

// Envia solicitacao de exclusao de conta/dados.
export const requestDeletion = (payload) =>
  api.post('/users/deletion-request', payload).then((res) => res.data);

// Lista logs de seguranca visiveis para o usuario atual.
export const getSecurityLogs = () => api.get('/users/logs').then((res) => res.data);

// Inicia cadastro do app autenticador (OTP).
export const startOtpEnrollment = () =>
  api.post('/users/me/mfa/otp/start').then((res) => res.data);

// Confirma codigo OTP para concluir o cadastro MFA.
export const confirmOtpEnrollment = (payload) =>
  api.post('/users/me/mfa/otp/confirm', payload).then((res) => res.data);
