import api from './client.js';

// Banco de modelos de cultura para associação às estufas
export const listCulturePresets = () =>
  api.get('/presets/cultures').then((res) => res.data);

export const getCulturePreset = (presetId) =>
  api.get(`/presets/cultures/${presetId}`).then((res) => res.data);

export const createCulturePreset = (payload) =>
  api.post('/presets/cultures', payload).then((res) => res.data);

export const updateCulturePreset = (presetId, payload) =>
  api.put(`/presets/cultures/${presetId}`, payload).then((res) => res.data);

export const deleteCulturePreset = (presetId) =>
  api.delete(`/presets/cultures/${presetId}`).then((res) => res.data);
