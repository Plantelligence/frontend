/**
 * Serviço de perfil do usuário — dados pessoais, senha, MFA e exclusão de conta.
 *
 * Todas as funções operam sobre o usuário logado (/users/me).
 * Troca de senha requer um desafio de segurança antes (requestPasswordChangeChallenge)
 * para confirmar que é o dono da conta fazendo a alteração.
 */

// Importa a instância Axios com interceptores de autenticação JWT
import api from './client.js';

// Busca o perfil completo do usuário autenticado (nome, e-mail, role, organização)
export const getProfile = () =>
  api.get('/users/me').then((res) => res.data);

// Atualiza os dados pessoais do perfil (nome, preferências, etc.)
export const updateProfile = (payload) =>
  api.put('/users/me', payload).then((res) => res.data);

// gera um desafio (código por e-mail ou MFA) antes de permitir troca de senha
// isso evita que alguém que encontrou uma sessão aberta troque a senha do dono
export const requestPasswordChangeChallenge = () =>
  api.post('/users/change-password/challenge').then((res) => res.data);

// Aplica a nova senha após o usuário ter passado pelo desafio de segurança
export const changePassword = (payload) =>
  api.post('/users/change-password', payload).then((res) => res.data);

// solicitação de exclusão de dados conforme LGPD — não exclui imediatamente
// o backend registra a solicitação e processa dentro do prazo legal
export const requestDeletion = (payload) =>
  api.post('/users/deletion-request', payload).then((res) => res.data);

// Busca o histórico de eventos de segurança da conta (logins, bloqueios, etc.)
// Suporta filtro por período via fromDate e untilDate no formato ISO
export const getSecurityLogs = (limit = 500, fromDate = null, untilDate = null) =>
  api.get('/users/logs', {
    params: {
      limit,
      // Só inclui os parâmetros de data se foram informados, evitando query string suja
      ...(fromDate  ? { from_date:  fromDate  } : {}),
      ...(untilDate ? { until_date: untilDate } : {}),
    },
  }).then((res) => res.data);

// inicia o cadastro do app autenticador (retorna QR Code e chave TOTP)
// o usuário escaneia o QR no Google Authenticator ou similar
export const startOtpEnrollment = () =>
  api.post('/users/me/mfa/otp/start').then((res) => res.data);

// confirma o código gerado pelo app para ativar o MFA na conta
// só ativa após confirmar que o usuário configurou corretamente o app
export const confirmOtpEnrollment = (payload) =>
  api.post('/users/me/mfa/otp/confirm', payload).then((res) => res.data);
