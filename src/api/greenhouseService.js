// Servico de API para estufas — centraliza todas as chamadas HTTP relacionadas a estufas.
import api from './client.js';

// Busca recomendacoes de cultivo para apoiar criacao da estufa.
export const getFlowerRecommendations = () =>
  api.get('/greenhouse/recommendations').then((res) => res.data);

// Lista todas as estufas do usuario autenticado.
export const listGreenhouses = () =>
  api.get('/greenhouse').then((res) => res.data);

// Cria uma nova estufa com os dados do formulario.
export const createGreenhouse = (payload) =>
  api.post('/greenhouse', payload).then((res) => res.data);

// Carrega os detalhes de uma estufa especifica.
export const getGreenhouse = (greenhouseId) =>
  api.get(`/greenhouse/${greenhouseId}`).then((res) => res.data);

// Atualiza os dados principais da estufa.
export const updateGreenhouse = (greenhouseId, payload) =>
  api.put(`/greenhouse/${greenhouseId}`, payload).then((res) => res.data);

// Liga ou desliga alertas da estufa.
export const updateGreenhouseAlerts = (greenhouseId, payload) =>
  api.patch(`/greenhouse/${greenhouseId}/alerts`, payload).then((res) => res.data);

// Pede ao backend a avaliacao dos sensores atuais.
export const evaluateGreenhouseMetrics = (greenhouseId, payload) =>
  api.post(`/greenhouse/${greenhouseId}/evaluate`, payload).then((res) => res.data);

// Exclui a estufa selecionada.
export const deleteGreenhouse = (greenhouseId) =>
  api.delete(`/greenhouse/${greenhouseId}`).then((res) => res.data);
