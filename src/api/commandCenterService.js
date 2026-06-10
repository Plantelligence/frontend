/**
 * commandCenterService — Cliente HTTP para o Centro de Comando da Estufa.
 *
 * Endpoints consumidos:
 *   GET  /api/estufas/{id}/centro-comando          — DTO completo do Centro de Comando
 *   PATCH /api/estufas/{id}/fase                   — troca a fase biologica
 *   POST /api/estufas/{id}/automacao/suspender     — suspende a automacao (modo manual)
 *   POST /api/estufas/{id}/automacao/retomar       — retoma a automacao automatica
 */

// Importa a instância Axios com interceptores JWT para autenticação automática
import api from './client.js';

/**
 * Busca o DTO completo do Centro de Comando para uma estufa.
 * O DTO inclui fase biológica atual, status da automação e estado dos atuadores.
 *
 * @param {string} estufaId - ID da estufa
 * @returns {Promise<CommandCenterDTO>}
 */
export const getCommandCenter = (estufaId) =>
  api.get(`/estufas/${estufaId}/centro-comando`).then((res) => res.data);

/**
 * Altera a fase biologica da estufa.
 * Cada fase (incubação, frutificação, colheita) tem parâmetros ideais diferentes
 * definidos no perfil de cultivo vinculado à estufa.
 *
 * @param {string} estufaId - ID da estufa
 * @param {'incubacao'|'frutificacao'|'colheita'} fase - Nova fase
 * @param {string|null} motivo - Motivo da troca (opcional, registrado no histórico)
 */
export const trocarFase = (estufaId, fase, motivo = null) =>
  api.patch(`/estufas/${estufaId}/fase`, { fase, motivo }).then((res) => res.data);

/**
 * Suspende a automacao automatica da estufa por N minutos.
 * Durante a suspensão, o ESP32 aguarda comandos manuais em vez de atuar
 * automaticamente baseado nos dados dos sensores.
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
 * Após retomar, o sistema volta a controlar os atuadores com base nos sensores.
 *
 * @param {string} estufaId - ID da estufa
 */
export const retomarAutomacao = (estufaId) =>
  api.post(`/estufas/${estufaId}/automacao/retomar`).then((res) => res.data);
