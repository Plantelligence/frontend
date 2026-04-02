import api from './client.js';

// Banco de modelos de cultura para associação às estufas
// Lista presets de cultura disponiveis.
export const listCulturePresets = () =>
  api.get('/presets/cultures').then((res) => res.data);

// Busca um preset pelo identificador.
export const getCulturePreset = (presetId) =>
  api.get(`/presets/cultures/${presetId}`).then((res) => res.data);

// Cria novo preset de cultura.
export const createCulturePreset = (payload) =>
  api.post('/presets/cultures', payload).then((res) => res.data);

// Atualiza dados de um preset existente.
export const updateCulturePreset = (presetId, payload) =>
  api.put(`/presets/cultures/${presetId}`, payload).then((res) => res.data);

// Remove preset do catalogo.
export const deleteCulturePreset = (presetId) =>
  api.delete(`/presets/cultures/${presetId}`).then((res) => res.data);
