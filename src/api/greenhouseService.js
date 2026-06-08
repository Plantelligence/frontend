/**
 * Serviço de estufas — CRUD, alertas, equipe e clima externo.
 *
 * A estufa é o recurso central do sistema. Este serviço cobre:
 *   - Criação, edição e remoção de estufas
 *   - Busca de localização por CEP
 *   - Vinculação de perfil de cultivo (preset)
 *   - Configuração de limites de alerta por sensor
 *   - Gerenciamento da equipe responsável
 *   - Avaliação automática das condições com base nos dados dos sensores
 *   - Busca de clima externo da cidade vinculada (OpenWeatherMap)
 *
 * Alguns endpoints têm fallback para rotas legadas (/estufas vs /greenhouse)
 * para manter compatibilidade enquanto a migração do schema está em andamento.
 */

import api from './client.js';

const isNotFound = (error) => Number(error?.response?.status) === 404;

// Resolve { min, max } from both old format ({ min, max }) and new nested format ({ ideal: { min, max }, ... })
const resolveProfileRange = (metric) => {
  if (!metric || typeof metric !== 'object') return null;
  const source = metric.ideal && typeof metric.ideal === 'object' ? metric.ideal : metric;
  const min = Number(source.min);
  const max = Number(source.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
};

const simplifyProfileSummary = (value) => {
  const text = String(value ?? '').trim();
  if (!text) {
    return '';
  }

  return text
    .replace(/Lentinula edodes/gi, 'Shiitake')
    .replace(/Hypsizygus tessellatus/gi, 'Shimeji')
    .replace(/Agaricus bisporus/gi, 'Champignon')
    .replace(/frutificacao/gi, 'produção')
    .replace(/choque termico/gi, 'ajuste de temperatura')
    .replace(/umidade relativa/gi, 'umidade do ar');
};

const mapGreenhouse = (item) => ({
  id: item?.id,
  name: item?.nome ?? item?.name ?? 'Estufa sem nome',
  cep: item?.cep ?? null,
  city: item?.cidade ?? item?.city ?? '',
  state: item?.estado ?? item?.state ?? '',
  flowerProfileId: item?.preset_id ?? item?.flowerProfileId ?? null,
  alertsEnabled: item?.alerts_enabled ?? item?.alertsEnabled ?? true,
  lastAlertAt: item?.last_alert_at ?? item?.lastAlertAt ?? null,
  alertThresholds: item?.alert_thresholds ?? item?.alertThresholds ?? null,
  responsibleUserIds: item?.responsible_user_ids ?? item?.responsibleUserIds ?? [],
  watchersDetails: item?.watchers_details ?? item?.watchersDetails ?? [],
  profile: (item?.preset ?? item?.profile) ? {
    id: (item.preset ?? item.profile).id,
    name: (item.preset ?? item.profile).nome_cultura ?? (item.preset ?? item.profile).name ?? 'Perfil sem nome',
    summary: simplifyProfileSummary((item.preset ?? item.profile).descricao ?? (item.preset ?? item.profile).summary ?? ''),
    temperature: resolveProfileRange((item.preset ?? item.profile).temperatura) ?? resolveProfileRange((item.preset ?? item.profile).temperature) ?? null,
    humidity: resolveProfileRange((item.preset ?? item.profile).umidade) ?? resolveProfileRange((item.preset ?? item.profile).humidity) ?? null,
    luminosity: resolveProfileRange((item.preset ?? item.profile).luminosidade) ?? resolveProfileRange((item.preset ?? item.profile).luminosity) ?? null,
    soilMoisture: resolveProfileRange((item.preset ?? item.profile).umidade_solo) ?? resolveProfileRange((item.preset ?? item.profile).soilMoisture) ?? null,
  } : null,
  createdAt: item?.created_at ?? item?.createdAt ?? null,
  updatedAt: item?.updated_at ?? item?.updatedAt ?? null
});

const normalizeGreenhouseList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.greenhouses)) {
    return payload.greenhouses;
  }

  if (Array.isArray(payload?.estufas)) {
    return payload.estufas;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

export const getFlowerRecommendations = () =>
  api.get('/estufas/recomendacoes').then((res) => ({
    ...res.data,
    profiles: (res.data?.profiles ?? []).map((profile) => ({
      ...profile,
      summary: simplifyProfileSummary(profile?.summary)
    }))
  }));

export const listGreenhouses = () =>
  api.get('/estufas/').then((res) => ({
    greenhouses: normalizeGreenhouseList(res.data).map(mapGreenhouse)
  }));

export const createGreenhouse = (payload) =>
  api.post('/estufas/', {
    nome: payload?.name,
    cep: payload?.cep,
    cidade: payload?.city,
    estado: payload?.state,
    preset_id: payload?.flowerProfileId ?? null
  }).then((res) => ({ greenhouse: mapGreenhouse(res.data) }));

export const getGreenhouse = (greenhouseId) =>
  api.get(`/estufas/${greenhouseId}`).then((res) => ({ greenhouse: mapGreenhouse(res.data) }));

export const updateGreenhouse = (greenhouseId, payload) =>
  api.put(`/estufas/${greenhouseId}`, {
    nome: payload?.name,
    cep: payload?.cep,
    cidade: payload?.city,
    estado: payload?.state,
    preset_id: payload?.flowerProfileId ?? null
  }).then((res) => ({ greenhouse: mapGreenhouse(res.data) }));

export const resolveCepLocation = (cep) => {
  const normalizedCep = String(cep ?? '').replace(/\D/g, '');
  if (normalizedCep.length !== 8) {
    return Promise.reject(new Error('CEP invalido. Informe 8 digitos.'));
  }
  return api.get(`/estufas/cep/${encodeURIComponent(normalizedCep)}`).then((res) => res.data);
};

export const getGreenhouseExternalWeather = (greenhouseId) =>
  api.get(`/clima/${greenhouseId}/externo`).then((res) => res.data);

// Salva limiares de alerta personalizados para a estufa.
export const updateAlertThresholds = (greenhouseId, thresholds) =>
  api.patch(`/estufas/${greenhouseId}/alert-thresholds`, thresholds)
    .then((res) => ({ greenhouse: mapGreenhouse(res.data) }));

export const updateGreenhouseAlerts = (greenhouseId, payload) =>
  api.patch(`/estufas/${greenhouseId}/alerts`, payload)
    .then((res) => ({ greenhouse: mapGreenhouse(res.data) }))
    .catch((error) => {
      if (!isNotFound(error)) {
        throw error;
      }
      return api.patch(`/greenhouse/${greenhouseId}/alerts`, payload).then((res) => ({
        greenhouse: mapGreenhouse(res.data?.greenhouse ?? res.data)
      }));
    });

export const evaluateGreenhouseMetrics = (greenhouseId, payload) =>
  api.post(`/estufas/${greenhouseId}/evaluate`, payload)
    .then((res) => ({
      ...res.data,
      greenhouse: res.data?.greenhouse ? mapGreenhouse(res.data.greenhouse) : null
    }))
    .catch((error) => {
      if (!isNotFound(error)) {
        throw error;
      }
      return api.post(`/greenhouse/${greenhouseId}/evaluate`, payload).then((res) => ({
        ...res.data,
        greenhouse: res.data?.greenhouse ? mapGreenhouse(res.data.greenhouse) : null
      }));
    });

export const listGreenhouseTeamMembers = () =>
  api.get('/estufas/responsaveis/membros')
    .then((res) => res.data)
    .catch((error) => {
      if (!isNotFound(error)) {
        throw error;
      }
      // Backend antigo pode não ter endpoint de responsáveis ainda.
      return { members: [] };
    });

export const updateGreenhouseTeam = (greenhouseId, responsibleUserIds) =>
  api.patch(`/estufas/${greenhouseId}/team`, { responsibleUserIds })
    .then((res) => ({
      greenhouse: mapGreenhouse(res.data)
    }))
    .catch((error) => {
      if (!isNotFound(error)) {
        throw error;
      }
      // Se endpoint não existir, retorna estado mínimo sem quebrar a página.
      return {
        greenhouse: {
          id: greenhouseId,
          responsibleUserIds: Array.isArray(responsibleUserIds) ? responsibleUserIds : [],
          watchersDetails: []
        }
      };
    });

export const deleteGreenhouse = (greenhouseId) =>
  api.delete(`/estufas/${greenhouseId}`).then((res) => res.data);
