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

// Importa a instância Axios configurada com interceptores JWT
import api from './client.js';

// Retorna a lista completa de usuários da organização do admin logado
export const getUsers = () =>
  api.get('/admin/users').then((res) => res.data);

// Cria um novo usuário na organização e dispara o e-mail de convite com link de primeiro acesso
export const createUserByAdmin = (payload) =>
  api.post('/admin/users', payload).then((res) => res.data);

// Altera o papel do usuário dentro da organização (Admin, Operator ou Reader)
export const updateUserRole = ({ userId, role }) =>
  api.put(`/admin/users/${userId}/role`, { role }).then((res) => res.data);

// Busca as estufas que podem ser atribuídas a um usuário Reader
export const listAssignableGreenhouses = () =>
  api.get('/admin/greenhouses').then((res) => res.data);

// Bloqueia ou desbloqueia o acesso de um usuário, opcionalmente informando o motivo
export const updateUserAccessStatus = ({ userId, blocked, reason }) =>
  api.put(`/admin/users/${userId}/access-status`, { blocked, reason }).then((res) => res.data);

// define a lista de estufas que um Reader específico pode acessar
// perfis Reader têm visibilidade restrita apenas às estufas atribuídas pelo admin
export const updateReaderGreenhouses = ({ userId, greenhouseIds }) =>
  api.put(`/admin/users/${userId}/reader-greenhouses`, { greenhouseIds }).then((res) => res.data);

// Reenvia o e-mail de convite para usuários que ainda não concluíram o primeiro acesso
export const resendUserInvite = ({ userId }) =>
  api.post(`/admin/users/${userId}/resend-invite`).then((res) => res.data);

// Remove o usuário do sistema permanentemente — ação irreversível
export const deleteUserByAdmin = ({ userId }) =>
  api.delete(`/admin/users/${userId}`).then((res) => res.data);

// encerra a organização inteira e remove todos os dados vinculados
// ação irreversível: estufas, dispositivos e usuários são excluídos em cascata
export const deactivateOrganization = () =>
  api.post('/admin/organization/deactivate').then((res) => res.data);
