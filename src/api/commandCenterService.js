/**
 * commandCenterService — Cliente HTTP para o Centro de Comando da Estufa.
 *
 * Endpoints consumidos:
 *   GET  /api/estufas/{id}/centro-comando          — DTO completo do Centro de Comando
 *   PATCH /api/estufas/{id}/fase                   — troca a fase biologica
 *   POST /api/estufas/{id}/automacao/suspender     — suspende a automacao (modo manual)
 *   POST /api/estufas/{id}/automacao/retomar       — retoma a automacao automatica
 */

import api from './client.js';

/**
 * Busca o DTO completo do Centro de Comando para uma estufa.
 *
 * @param {string} estufaId - ID da estufa
 * @returns {Promise<CommandCenterDTO>}
 */
export const getCommandCenter = (estufaId) =>
  api.get(`/estufas/${estufaId}/centro-comando`).then((res) => res.data);

/**
 * Altera a fase biologica da estufa.
 *
 * @param {string} estufaId - ID da estufa
 * @param {'incubacao'|'frutificacao'|'colheita'} fase - Nova fase
 * @param {string|null} motivo - Motivo da troca (opcional)
 */
export const trocarFase = (estufaId, fase, motivo = null) =>
  api.patch(`/estufas/${estufaId}/fase`, { fase, motivo }).then((res) => res.data);

/**
 * Suspende a automacao automatica da estufa por N minutos.
 *
 * @param {string} estufaId - ID da estufa
 * @param {number} minutes  - Duracao da suspensao em minutos (default: 60)
 */
export const suspenderAutomacao = (estufaId, minutes = 60) =>
  api
    .post(`/estufas/${estufaId}/automacao/suspender`, { minutes })
    .then((res) => res.data);

/**
 * Retoma a automacao automatica da estufa (cancela o modo manual).
 *
 * @param {string} estufaId - ID da estufa
 */
export const retomarAutomacao = (estufaId) =>
  api.post(`/estufas/${estufaId}/automacao/retomar`).then((res) => res.data);
