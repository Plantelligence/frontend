/**
 * Serviço de perfis de cultivo (presets).
 *
 * Um preset define as condições ideais de uma espécie: faixas de temperatura,
 * umidade do ar, umidade do solo e luminosidade. Ele é vinculado à estufa e
 * usado pelo dashboard para avaliar se as condições estão dentro do esperado.
 *
 * Presets do sistema (Champignon, Shimeji, etc.) são pré-carregados no banco.
 * O usuário pode criar personalizados ou pedir sugestão à IA (suggestPresetWithAI).
 */

import api from './client.js';

// converte o objeto de preset do frontend para o formato esperado pelo backend
const toBackendPayload = (payload) => ({
  nome_cultura:  payload.nome_cultura,
  tipo_cultura:  payload.tipo_cultura ?? 'Cogumelos',
  descricao:     payload.descricao ?? null,
  temperatura:   payload.temperatura,
  umidade:       payload.umidade,
  luminosidade:  payload.luminosidade,
  umidade_solo:  payload.umidade_solo ?? null,
});

// gera nome para cópia evitando "(copia)" duplicado e respeitando o limite de 80 chars
const buildDuplicateName = (name = '') => {
  const base = String(name).replace(/\s*\(copia(?:\s+\d+)?\)\s*$/i, '').trim() || 'Perfil';
  const suffix = ' (copia)';
  return `${base.slice(0, Math.max(1, 80 - suffix.length)).trim()}${suffix}`;
};

// normaliza a resposta do backend, que pode vir como array, { presets }, { items } ou { data }
const normalizePresetList = (payload) => {
  if (Array.isArray(payload))           return payload;
  if (Array.isArray(payload?.presets))  return payload.presets;
  if (Array.isArray(payload?.items))    return payload.items;
  if (Array.isArray(payload?.data))     return payload.data;
  return [];
};

export const listCulturePresets = () =>
  api.get('/presets/').then((res) => normalizePresetList(res.data));

export const createCulturePreset = (payload) =>
  api.post('/presets/', toBackendPayload(payload)).then((res) => res.data);

export const updateCulturePreset = (presetId, payload) =>
  api.put(`/presets/${presetId}`, toBackendPayload(payload)).then((res) => res.data);

export const deleteCulturePreset = (presetId) =>
  api.delete(`/presets/${presetId}`).then((res) => res.data);

// envia uma descrição livre para a IA e recebe os parâmetros sugeridos como JSON
export const suggestPresetWithAI = (descricao) =>
  api.post('/presets/sugestao-ia', { descricao }).then((res) => res.data);

// cria um clone do preset com nome "(copia)" — facilita criar variações
export const duplicateCulturePreset = (preset) =>
  createCulturePreset({
    nome_cultura: buildDuplicateName(preset.nome_cultura),
    tipo_cultura: preset.tipo_cultura,
    descricao:    preset.descricao,
    temperatura:  preset.temperatura,
    umidade:      preset.umidade,
    luminosidade: preset.luminosidade,
    umidade_solo: preset.umidade_solo ?? null,
  });
