import api from './client.js';

const toBackendPayload = (payload) => ({
  nome_cultura: payload.nome_cultura,
  tipo_cultura: payload.tipo_cultura ?? 'Cogumelos',
  descricao: payload.descricao ?? null,
  temperatura: payload.temperatura,
  umidade: payload.umidade,
  luminosidade: payload.luminosidade
});

const buildDuplicateName = (name = '') => {
  const baseName = String(name)
    .replace(/\s*\(copia(?:\s+\d+)?\)\s*$/i, '')
    .trim();

  const safeBase = baseName || 'Perfil';
  const suffix = ' (copia)';
  const maxBaseLength = 80 - suffix.length;
  return `${safeBase.slice(0, Math.max(1, maxBaseLength)).trim()}${suffix}`;
};

const normalizePresetList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.presets)) {
    return payload.presets;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

// Lista presets disponiveis para o usuario (sistema + personalizados).
export const listCulturePresets = () =>
  api.get('/presets/').then((res) => normalizePresetList(res.data));

// Cria novo preset de cultura.
export const createCulturePreset = (payload) =>
  api.post('/presets/', toBackendPayload(payload)).then((res) => res.data);

// Atualiza dados de um preset existente.
export const updateCulturePreset = (presetId, payload) =>
  api.put(`/presets/${presetId}`, toBackendPayload(payload)).then((res) => res.data);

// Remove preset do catalogo.
export const deleteCulturePreset = (presetId) =>
  api.delete(`/presets/${presetId}`).then((res) => res.data);

// Duplica preset existente criando uma nova copia personalizada.
export const duplicateCulturePreset = (preset) =>
  createCulturePreset({
    nome_cultura: buildDuplicateName(preset.nome_cultura),
    tipo_cultura: preset.tipo_cultura,
    descricao: preset.descricao,
    temperatura: preset.temperatura,
    umidade: preset.umidade,
    luminosidade: preset.luminosidade
  });
