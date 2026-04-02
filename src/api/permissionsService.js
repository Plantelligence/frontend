// Servico de API para permissoes — controla acessos granulares por usuario.
import api from './client.js';

// Gestão de permissões granulares (além dos papéis administrador/operador)
export const getUserPermissions = (userId) =>
  api.get(`/admin/users/${userId}/permissions`).then((res) => res.data);

export const updateUserPermissions = (userId, payload) =>
  api.put(`/admin/users/${userId}/permissions`, payload).then((res) => res.data);
