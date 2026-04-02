// Servico de API para permissoes — controla acessos granulares por usuario.
import api from './client.js';

// Gestão de permissões granulares (além dos papéis administrador/operador)
// Consulta permissoes granulares de um usuario.
export const getUserPermissions = (userId) =>
  api.get(`/admin/users/${userId}/permissions`).then((res) => res.data);

// Atualiza permissoes granulares de um usuario.
export const updateUserPermissions = (userId, payload) =>
  api.put(`/admin/users/${userId}/permissions`, payload).then((res) => res.data);
