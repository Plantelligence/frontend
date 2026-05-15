/**
 * Serviço de administração — gerenciamento de usuários da organização.
 *
 * Todas as rotas aqui exigem perfil Admin. O backend valida isso via JWT;
 * o frontend omite os botões para outros perfis, mas a verificação real
 * acontece no servidor.
 *
 * Funções disponíveis:
 *   getUsers                — lista todos os usuários da organização
 *   createUserByAdmin       — cria novo usuário e envia convite por e-mail
 *   updateUserRole          — altera o perfil (Admin / Operator / Reader)
 *   updateUserAccessStatus  — bloqueia ou desbloqueia uma conta
 *   updateReaderGreenhouses — define quais estufas um Reader pode visualizar
 *   resendUserInvite        — reenvia o e-mail de convite
 *   deleteUserByAdmin       — remove o usuário permanentemente
 *   deactivateOrganization  — encerra toda a organização (irreversível)
 */

import api from './client.js';

export const getUsers = () =>
  api.get('/admin/users').then((res) => res.data);

export const createUserByAdmin = (payload) =>
  api.post('/admin/users', payload).then((res) => res.data);

export const updateUserRole = ({ userId, role }) =>
  api.put(`/admin/users/${userId}/role`, { role }).then((res) => res.data);

export const listAssignableGreenhouses = () =>
  api.get('/admin/greenhouses').then((res) => res.data);

export const updateUserAccessStatus = ({ userId, blocked, reason }) =>
  api.put(`/admin/users/${userId}/access-status`, { blocked, reason }).then((res) => res.data);

// define a lista de estufas que um Reader específico pode acessar
export const updateReaderGreenhouses = ({ userId, greenhouseIds }) =>
  api.put(`/admin/users/${userId}/reader-greenhouses`, { greenhouseIds }).then((res) => res.data);

export const resendUserInvite = ({ userId }) =>
  api.post(`/admin/users/${userId}/resend-invite`).then((res) => res.data);

export const deleteUserByAdmin = ({ userId }) =>
  api.delete(`/admin/users/${userId}`).then((res) => res.data);

// encerra a organização inteira e remove todos os dados vinculados
export const deactivateOrganization = () =>
  api.post('/admin/organization/deactivate').then((res) => res.data);
