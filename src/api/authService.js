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

// Importa a instância Axios configurada com interceptores de autenticação
import api from './client.js';

// Envia os dados de cadastro do novo usuário para criar a conta
export const register = (payload) =>
  api.post('/auth/register', payload).then((res) => res.data);

// Confirma o e-mail após o registro inicial, validando o código enviado por correio
export const confirmRegistration = (payload) =>
  api.post('/auth/register/confirm', payload).then((res) => res.data);

// finaliza o registro confirmando o código OTP enviado por e-mail
export const finalizeRegistration = (payload) =>
  api.post('/auth/register/otp', payload).then((res) => res.data);

// Envia e-mail e senha para autenticação; retorna dados de sessão ou desafio MFA
export const login = (payload) =>
  api.post('/auth/login', payload).then((res) => res.data);

// inicia o desafio MFA após login com senha (retorna o tipo de fator configurado)
export const initiateMfa = (payload) =>
  api.post('/auth/mfa/initiate', payload).then((res) => res.data);

// verifica o código MFA e conclui o login, retornando os tokens de sessão
export const verifyMfa = (payload) =>
  api.post('/auth/mfa/verify', payload).then((res) => res.data);

// Solicita renovação explícita do access token usando o refresh token do cookie
export const refresh = (payload) =>
  api.post('/auth/refresh', payload).then((res) => res.data);

// Encerra a sessão do usuário no servidor e invalida o refresh token no banco
export const logout = (payload) =>
  api.post('/auth/logout', payload).then((res) => res.status);

// verifica se um e-mail está cadastrado (fluxo step-by-step do login)
export const checkEmailExists = (email) =>
  api.post('/auth/check-email', { email }).then((res) => res.data);

// Solicita envio de e-mail com link ou código para redefinição de senha
export const requestPasswordReset = (payload) =>
  api.post('/auth/password-reset/request', payload).then((res) => res.data);

// verifica TOTP do autenticador e devolve resetToken para redefinição sem e-mail
export const verifyTotpForReset = (payload) =>
  api.post('/auth/password-reset/verify-totp', payload).then((res) => res.data);

// Confirma a nova senha usando o token de reset recebido por e-mail ou TOTP
export const confirmPasswordReset = (payload) =>
  api.post('/auth/password-reset/confirm', payload).then((res) => res.data);

// fluxo de primeiro acesso para usuários convidados (sem senha definida)
export const startFirstAccess = (payload) =>
  api.post('/auth/first-access/start', payload).then((res) => res.data);

// Completa o primeiro acesso definindo a senha e confirmando o e-mail do convidado
export const completeFirstAccess = (payload) =>
  api.post('/auth/first-access/complete', payload).then((res) => res.data);

// ── MFA reconfirmação para ações críticas ────────────────────────────────────
// Envia código por e-mail para o usuário autenticado (não requer payload)
export const initiateMfaReconfirm = () =>
  api.post('/auth/mfa-reconfirm/initiate').then((res) => res.data);

// Verifica o código (TOTP ou e-mail) e retorna novos tokens com sca=now
export const verifyMfaReconfirm = (payload) =>
  api.post('/auth/mfa-reconfirm/verify', payload).then((res) => res.data);
