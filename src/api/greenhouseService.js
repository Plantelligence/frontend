import api from './client.js';

const isNotFound = (error) => Number(error?.response?.status) === 404;

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
  responsibleUserIds: item?.responsible_user_ids ?? item?.responsibleUserIds ?? [],
  watchersDetails: item?.watchers_details ?? item?.watchersDetails ?? [],
  profile: item?.preset ?? item?.profile
    ? {
      id: (item.preset ?? item.profile).id,
      name: (item.preset ?? item.profile).nome_cultura ?? (item.preset ?? item.profile).name ?? 'Perfil sem nome',
      summary: simplifyProfileSummary((item.preset ?? item.profile).descricao ?? (item.preset ?? item.profile).summary ?? ''),
      temperature: (item.preset ?? item.profile).temperatura?.ideal ?? (item.preset ?? item.profile).temperature
        ? {
          min: Number(((item.preset ?? item.profile).temperatura?.ideal ?? (item.preset ?? item.profile).temperature).min),
          max: Number(((item.preset ?? item.profile).temperatura?.ideal ?? (item.preset ?? item.profile).temperature).max)
        }
        : null,
      humidity: (item.preset ?? item.profile).umidade?.ideal ?? (item.preset ?? item.profile).humidity
        ? {
          min: Number(((item.preset ?? item.profile).umidade?.ideal ?? (item.preset ?? item.profile).humidity).min),
          max: Number(((item.preset ?? item.profile).umidade?.ideal ?? (item.preset ?? item.profile).humidity).max)
        }
        : null,
      luminosity: (item.preset ?? item.profile).luminosidade?.ideal ?? (item.preset ?? item.profile).luminosity
        ? {
          min: Number(((item.preset ?? item.profile).luminosidade?.ideal ?? (item.preset ?? item.profile).luminosity).min),
          max: Number(((item.preset ?? item.profile).luminosidade?.ideal ?? (item.preset ?? item.profile).luminosity).max)
        }
        : null,
      // Compatibilidade com a avaliação atual baseada em soilMoisture.
      soilMoisture: (item.preset ?? item.profile).luminosidade?.ideal
        ?? (item.preset ?? item.profile).soilMoisture
        ?? (item.preset ?? item.profile).luminosity
        ? {
          min: Number(((item.preset ?? item.profile).luminosidade?.ideal ?? (item.preset ?? item.profile).soilMoisture ?? (item.preset ?? item.profile).luminosity).min),
          max: Number(((item.preset ?? item.profile).luminosidade?.ideal ?? (item.preset ?? item.profile).soilMoisture ?? (item.preset ?? item.profile).luminosity).max)
        }
        : null
    }
    : null,
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
