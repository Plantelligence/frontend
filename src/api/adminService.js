// Servico de API para administracao — gerencia usuarios, papeis e acoes administrativas.
import api from './client.js';

// Lista usuarios para a tela administrativa.
export const getUsers = () => api.get('/admin/users').then((res) => res.data);

// Cria usuario pelo painel admin.
export const createUserByAdmin = (payload) =>
  api.post('/admin/users', payload).then((res) => res.data);

// Atualiza papel do usuario (Admin/User).
export const updateUserRole = ({ userId, role }) =>
  api.put(`/admin/users/${userId}/role`, { role }).then((res) => res.data);

// Busca configuracao da estufa no contexto admin.
export const getUserGreenhouseConfig = (userId) =>
  api.get(`/admin/greenhouse/${userId}`).then((res) => res.data);

// Atualiza equipe associada a uma estufa.
export const updateGreenhouseTeam = ({ userId, watcherIds }) =>
  api.put(`/admin/greenhouse/${userId}/team`, { watcherIds }).then((res) => res.data);
