/**
 * Serviço de Relatórios — criação, listagem e remoção de relatórios de estufa.
 *
 * Um relatório registra as médias dos sensores (temperatura, umidade, umidade do solo
 * e luminosidade) para um período definido. Os dados são consultados automaticamente
 * no InfluxDB quando o usuário solicita um resumo.
 *
 * Funções disponíveis:
 *   listRelatorios      — lista todos os relatórios de uma estufa
 *   createRelatorio     — cria um novo relatório com os dados informados
 *   deleteRelatorio     — remove um relatório pelo ID
 *   getRelatorioResumo  — consulta as médias dos sensores no InfluxDB para um período
 */

// Importa a instância Axios com interceptores de autenticação JWT
import api from './client.js';

/**
 * Converte os nomes de campos em português/snake_case vindos do backend
 * para camelCase usado no frontend.
 */
const mapRelatorio = (item) => ({
  id: item?.id,
  // ID da estufa à qual o relatório pertence
  estufaId: item?.estufa_id ?? item?.estufaId,
  // Datas de início e fim do período coberto pelo relatório
  periodoInicio: item?.periodo_inicio ?? item?.periodoInicio ?? '',
  periodoFim: item?.periodo_fim ?? item?.periodoFim ?? '',
  // Médias calculadas pelo InfluxDB para cada sensor no período
  avgTemperatura: item?.avg_temperatura ?? item?.avgTemperatura ?? null,
  avgUmidade: item?.avg_umidade ?? item?.avgUmidade ?? null,
  avgUmidadeSolo: item?.avg_umidade_solo ?? item?.avgUmidadeSolo ?? null,
  avgLuminosidade: item?.avg_luminosidade ?? item?.avgLuminosidade ?? null,
  // Texto descritivo opcional sobre as condições observadas no período
  resumo: item?.resumo ?? null,
  criadoEm: item?.criado_em ?? item?.criadoEm ?? null,
  // ID do usuário que gerou o relatório, para fins de auditoria
  criadoPorId: item?.criado_por_id ?? item?.criadoPorId ?? null,
});

/** Retorna todos os relatórios de uma estufa, do mais recente ao mais antigo. */
export const listRelatorios = (estufaId) =>
  api.get(`/estufas/${estufaId}/relatorios`).then((res) => ({
    // Normaliza caso o backend retorne o array diretamente ou encapsulado
    relatorios: (Array.isArray(res.data) ? res.data : []).map(mapRelatorio),
  }));

/**
 * Cria e salva um novo relatório para a estufa.
 * Os campos de média (avgTemperatura etc.) podem vir do resumo automático (InfluxDB)
 * ou ser preenchidos manualmente pelo usuário.
 */
export const createRelatorio = (estufaId, payload) =>
  api.post(`/estufas/${estufaId}/relatorios`, {
    // Converte os nomes camelCase do frontend para snake_case do backend
    periodo_inicio: payload.periodoInicio,
    periodo_fim: payload.periodoFim,
    avg_temperatura: payload.avgTemperatura ?? null,
    avg_umidade: payload.avgUmidade ?? null,
    avg_umidade_solo: payload.avgUmidadeSolo ?? null,
    avg_luminosidade: payload.avgLuminosidade ?? null,
    // Texto descritivo gerado pelo usuário ou sugerido pela IA
    resumo: payload.resumo ?? null,
  }).then((res) => ({ relatorio: mapRelatorio(res.data) }));

/** Remove um relatório pelo ID. Esta ação não pode ser desfeita. */
export const deleteRelatorio = (estufaId, relatorioId) =>
  api.delete(`/estufas/${estufaId}/relatorios/${relatorioId}`).then(() => null);

/**
 * Consulta o InfluxDB e retorna as médias dos 4 sensores para o período informado.
 * As datas devem estar no formato YYYY-MM-DD (ex.: "2025-01-01").
 * O resultado é usado para preencher automaticamente um novo relatório.
 */
export const getRelatorioResumo = (estufaId, inicio, fim) =>
  api
    // Envia as datas como query params para o backend montar a query no InfluxDB
    .get(`/estufas/${estufaId}/relatorios/resumo`, { params: { inicio, fim } })
    .then((res) => res.data);
