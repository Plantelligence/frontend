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

// Importa a instância Axios com interceptores de autenticação
import api from './client.js';

// Verifica se o erro HTTP é um 404 — usado para acionar fallback de rotas legadas
const isNotFound = (error) => Number(error?.response?.status) === 404;

// Resolve { min, max } from both old format ({ min, max }) and new nested format ({ ideal: { min, max }, ... })
// necessário porque o backend usou dois formatos diferentes em versões distintas
const resolveProfileRange = (metric) => {
  if (!metric || typeof metric !== 'object') return null;
  // Suporta tanto o formato novo ({ ideal: { min, max } }) quanto o antigo ({ min, max })
  const source = metric.ideal && typeof metric.ideal === 'object' ? metric.ideal : metric;
  const min = Number(source.min);
  const max = Number(source.max);
  // Se os valores não forem números finitos, o range é inválido — retorna null
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
};

// Simplifica nomes científicos e termos técnicos nos resumos dos perfis
// para que o usuário leigo entenda sem precisar conhecer botânica
const simplifyProfileSummary = (value) => {
  const text = String(value ?? '').trim();
  if (!text) {
    return '';
  }

  return text
    // Troca nomes científicos pelos nomes populares mais conhecidos
    .replace(/Lentinula edodes/gi, 'Shiitake')
    .replace(/Hypsizygus tessellatus/gi, 'Shimeji')
    .replace(/Agaricus bisporus/gi, 'Champignon')
    // Substitui termos técnicos por linguagem mais acessível
    .replace(/frutificacao/gi, 'produção')
    .replace(/choque termico/gi, 'ajuste de temperatura')
    .replace(/umidade relativa/gi, 'umidade do ar');
};

// Converte os campos do backend (snake_case em português) para o padrão do frontend (camelCase)
// centraliza a normalização para que nenhum componente precise conhecer o schema do banco
const mapGreenhouse = (item) => ({
  id: item?.id,
  // Suporta tanto 'nome' (legado) quanto 'name' (novo)
  name: item?.nome ?? item?.name ?? 'Estufa sem nome',
  cep: item?.cep ?? null,
  city: item?.cidade ?? item?.city ?? '',
  state: item?.estado ?? item?.state ?? '',
  // ID do preset/perfil de cultivo vinculado a esta estufa
  flowerProfileId: item?.preset_id ?? item?.flowerProfileId ?? null,
  alertsEnabled: item?.alerts_enabled ?? item?.alertsEnabled ?? true,
  lastAlertAt: item?.last_alert_at ?? item?.lastAlertAt ?? null,
  alertThresholds: item?.alert_thresholds ?? item?.alertThresholds ?? null,
  // IDs dos usuários responsáveis pela estufa
  responsibleUserIds: item?.responsible_user_ids ?? item?.responsibleUserIds ?? [],
  // Detalhes dos watchers para exibir nomes e avatares sem nova requisição
  watchersDetails: item?.watchers_details ?? item?.watchersDetails ?? [],
  // Perfil de cultivo embutido na resposta — evita uma segunda chamada à API
  profile: (item?.preset ?? item?.profile) ? {
    id: (item.preset ?? item.profile).id,
    name: (item.preset ?? item.profile).nome_cultura ?? (item.preset ?? item.profile).name ?? 'Perfil sem nome',
    summary: simplifyProfileSummary((item.preset ?? item.profile).descricao ?? (item.preset ?? item.profile).summary ?? ''),
    // Normaliza as faixas ideais de cada sensor para o formato { min, max }
    temperature: resolveProfileRange((item.preset ?? item.profile).temperatura) ?? resolveProfileRange((item.preset ?? item.profile).temperature) ?? null,
    humidity: resolveProfileRange((item.preset ?? item.profile).umidade) ?? resolveProfileRange((item.preset ?? item.profile).humidity) ?? null,
    luminosity: resolveProfileRange((item.preset ?? item.profile).luminosidade) ?? resolveProfileRange((item.preset ?? item.profile).luminosity) ?? null,
    soilMoisture: resolveProfileRange((item.preset ?? item.profile).umidade_solo) ?? resolveProfileRange((item.preset ?? item.profile).soilMoisture) ?? null,
  } : null,
  createdAt: item?.created_at ?? item?.createdAt ?? null,
  updatedAt: item?.updated_at ?? item?.updatedAt ?? null
});

// Normaliza a resposta da listagem, que pode vir em formatos diferentes dependendo da versão da API
const normalizeGreenhouseList = (payload) => {
  // Resposta já é um array direto
  if (Array.isArray(payload)) {
    return payload;
  }

  // Resposta encapsulada em { greenhouses: [...] }
  if (Array.isArray(payload?.greenhouses)) {
    return payload.greenhouses;
  }

  // Formato legado em português: { estufas: [...] }
  if (Array.isArray(payload?.estufas)) {
    return payload.estufas;
  }

  // Formato paginado genérico: { data: [...] }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  // Caso inesperado: retorna lista vazia para não quebrar a tela
  return [];
};

// Busca os perfis de cultivo recomendados com base nos dados do sistema
export const getFlowerRecommendations = () =>
  api.get('/estufas/recomendacoes').then((res) => ({
    ...res.data,
    // Simplifica os resumos de todos os perfis retornados
    profiles: (res.data?.profiles ?? []).map((profile) => ({
      ...profile,
      summary: simplifyProfileSummary(profile?.summary)
    }))
  }));

// Busca todas as estufas do usuário logado e normaliza os dados
export const listGreenhouses = () =>
  api.get('/estufas/').then((res) => ({
    greenhouses: normalizeGreenhouseList(res.data).map(mapGreenhouse)
  }));

// Cria uma nova estufa — converte os campos do frontend para o formato esperado pelo backend
export const createGreenhouse = (payload) =>
  api.post('/estufas/', {
    nome: payload?.name,
    cep: payload?.cep,
    cidade: payload?.city,
    estado: payload?.state,
    // preset_id é opcional: pode ser vinculado depois pelo usuário
    preset_id: payload?.flowerProfileId ?? null
  }).then((res) => ({ greenhouse: mapGreenhouse(res.data) }));

// Busca os detalhes de uma estufa específica pelo ID
export const getGreenhouse = (greenhouseId) =>
  api.get(`/estufas/${greenhouseId}`).then((res) => ({ greenhouse: mapGreenhouse(res.data) }));

// Atualiza os dados de uma estufa existente (nome, localização ou perfil de cultivo)
export const updateGreenhouse = (greenhouseId, payload) =>
  api.put(`/estufas/${greenhouseId}`, {
    nome: payload?.name,
    cep: payload?.cep,
    cidade: payload?.city,
    estado: payload?.state,
    preset_id: payload?.flowerProfileId ?? null
  }).then((res) => ({ greenhouse: mapGreenhouse(res.data) }));

// Busca o endereço completo a partir do CEP usando a API do ViaCEP via backend
export const resolveCepLocation = (cep) => {
  // Remove qualquer caractere não numérico do CEP antes de enviar
  const normalizedCep = String(cep ?? '').replace(/\D/g, '');
  if (normalizedCep.length !== 8) {
    return Promise.reject(new Error('CEP invalido. Informe 8 digitos.'));
  }
  return api.get(`/estufas/cep/${encodeURIComponent(normalizedCep)}`).then((res) => res.data);
};

// Busca as condições climáticas externas da cidade onde a estufa está localizada
export const getGreenhouseExternalWeather = (greenhouseId) =>
  api.get(`/clima/${greenhouseId}/externo`).then((res) => res.data);

// Salva limiares de alerta personalizados para a estufa.
// Os limiares definem os limites fora dos quais uma notificação é disparada
export const updateAlertThresholds = (greenhouseId, thresholds) =>
  api.patch(`/estufas/${greenhouseId}/alert-thresholds`, thresholds)
    .then((res) => ({ greenhouse: mapGreenhouse(res.data) }));

// Ativa ou desativa o sistema de alertas da estufa
// Tem fallback para a rota legada /greenhouse caso a nova rota ainda não exista no servidor
export const updateGreenhouseAlerts = (greenhouseId, payload) =>
  api.patch(`/estufas/${greenhouseId}/alerts`, payload)
    .then((res) => ({ greenhouse: mapGreenhouse(res.data) }))
    .catch((error) => {
      // Só tenta a rota legada se o erro foi 404 — outros erros devem ser propagados
      if (!isNotFound(error)) {
        throw error;
      }
      return api.patch(`/greenhouse/${greenhouseId}/alerts`, payload).then((res) => ({
        greenhouse: mapGreenhouse(res.data?.greenhouse ?? res.data)
      }));
    });

// Avalia se as condições atuais da estufa estão dentro dos parâmetros ideais do perfil
// Também tem fallback para a rota legada por compatibilidade
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
      // Tenta rota antiga caso a nova ainda não esteja disponível no backend
      return api.post(`/greenhouse/${greenhouseId}/evaluate`, payload).then((res) => ({
        ...res.data,
        greenhouse: res.data?.greenhouse ? mapGreenhouse(res.data.greenhouse) : null
      }));
    });

// Lista todos os membros que podem ser responsáveis por estufas na organização
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

// Atualiza a lista de usuários responsáveis por uma estufa específica
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

// Remove permanentemente a estufa e todos os dados vinculados (dispositivos, telemetria, relatórios)
export const deleteGreenhouse = (greenhouseId) =>
  api.delete(`/estufas/${greenhouseId}`).then((res) => res.data);
