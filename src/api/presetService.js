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

// Importa a instância Axios com interceptores de autenticação JWT
import api from './client.js';

// converte o objeto de preset do frontend para o formato esperado pelo backend
// centraliza a tradução dos nomes de campos para evitar inconsistências entre chamadas
const toBackendPayload = (payload) => ({
  nome_cultura:  payload.nome_cultura,
  // Se o tipo não for informado, assume 'Cogumelos' como padrão do sistema
  tipo_cultura:  payload.tipo_cultura ?? 'Cogumelos',
  descricao:     payload.descricao ?? null,
  temperatura:   payload.temperatura,
  umidade:       payload.umidade,
  luminosidade:  payload.luminosidade,
  // umidade_solo é opcional: nem todos os tipos de cultivo precisam deste sensor
  umidade_solo:  payload.umidade_solo ?? null,
});

// gera nome para cópia evitando "(copia)" duplicado e respeitando o limite de 80 chars
// evita que múltiplas duplicações gerem nomes como "Perfil (copia) (copia)"
const buildDuplicateName = (name = '') => {
  // Remove o sufixo "(copia)" existente para criar uma cópia limpa
  const base = String(name).replace(/\s*\(copia(?:\s+\d+)?\)\s*$/i, '').trim() || 'Perfil';
  const suffix = ' (copia)';
  // Garante que o nome total não ultrapasse 80 caracteres
  return `${base.slice(0, Math.max(1, 80 - suffix.length)).trim()}${suffix}`;
};

// normaliza a resposta do backend, que pode vir como array, { presets }, { items } ou { data }
// garante compatibilidade com diferentes versões do endpoint de listagem
const normalizePresetList = (payload) => {
  if (Array.isArray(payload))           return payload;
  if (Array.isArray(payload?.presets))  return payload.presets;
  if (Array.isArray(payload?.items))    return payload.items;
  if (Array.isArray(payload?.data))     return payload.data;
  // Caso inesperado: retorna lista vazia para não quebrar a tela de perfis
  return [];
};

// Retorna todos os perfis de cultivo disponíveis para o usuário (do sistema + personalizados)
export const listCulturePresets = () =>
  api.get('/presets/').then((res) => normalizePresetList(res.data));

// Cria um novo perfil de cultivo personalizado com os parâmetros fornecidos
export const createCulturePreset = (payload) =>
  api.post('/presets/', toBackendPayload(payload)).then((res) => res.data);

// Atualiza os parâmetros de um perfil de cultivo existente
export const updateCulturePreset = (presetId, payload) =>
  api.put(`/presets/${presetId}`, toBackendPayload(payload)).then((res) => res.data);

// Remove permanentemente um perfil de cultivo personalizado
export const deleteCulturePreset = (presetId) =>
  api.delete(`/presets/${presetId}`).then((res) => res.data);

// envia uma descrição livre para a IA e recebe os parâmetros sugeridos como JSON
// permite criar presets sem precisar conhecer os valores ideais manualmente
export const suggestPresetWithAI = (descricao) =>
  // timeout estendido para 60s: chamadas de IA podem demorar no cold start do servidor
  api.post('/presets/sugestao-ia', { descricao }, { timeout: 60000 }).then((res) => res.data);

// cria um clone do preset com nome "(copia)" — facilita criar variações
// útil quando o usuário quer ajustar um perfil sem perder o original
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
