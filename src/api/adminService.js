import api from './client.js';

export const getUsers = () => api.get('/admin/users').then((res) => res.data);

export const createUserByAdmin = (payload) =>
  api.post('/admin/users', payload).then((res) => res.data);

// Admin/Collaborator/Reader
export const updateUserRole = ({ userId, role }) =>
  api.put(`/admin/users/${userId}/role`, { role }).then((res) => res.data);

export const listAssignableGreenhouses = () =>
  api.get('/admin/greenhouses').then((res) => res.data);

export const updateUserAccessStatus = ({ userId, blocked, reason }) =>
  api.put(`/admin/users/${userId}/access-status`, { blocked, reason }).then((res) => res.data);

export const updateReaderGreenhouses = ({ userId, greenhouseIds }) =>
  api.put(`/admin/users/${userId}/reader-greenhouses`, { greenhouseIds }).then((res) => res.data);

export const resendUserInvite = ({ userId }) =>
  api.post(`/admin/users/${userId}/resend-invite`).then((res) => res.data);

export const deleteUserByAdmin = ({ userId }) =>
  api.delete(`/admin/users/${userId}`).then((res) => res.data);

export const deactivateOrganization = () =>
  api.post('/admin/organization/deactivate').then((res) => res.data);
