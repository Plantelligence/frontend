/**
 * Serviço de Telemetria — envio manual de leituras de sensores.
 *
 * Normalmente os dados de temperatura, umidade, umidade do solo e luminosidade
 * chegam automaticamente dos sensores do ESP32 via Azure IoT Hub.
 * Esta função permite que o frontend envie leituras manualmente quando necessário
 * (por exemplo, em testes ou quando o ESP32 não está conectado).
 *
 * O token JWT do usuário logado é enviado automaticamente pelo interceptor HTTP,
 * portanto não é necessário informar credenciais aqui.
 */

// Importa a instância Axios com interceptores de autenticação já configurados
import api from './client.js';

/**
 * Envia uma leitura manual dos 4 sensores para a estufa especificada.
 * Os valores são gravados no InfluxDB (banco de séries temporais).
 *
 * @param {string} estufaId - ID da estufa que receberá a leitura
 * @param {object} leitura  - Objeto com os valores dos sensores (null = não informado)
 */
export const enviarTelemetria = (estufaId, leitura) =>
  api
    .post(`/estufas/${estufaId}/telemetria`, {
      // ?? null garante que campos não informados sejam enviados como null e não como undefined
      temperatura:  leitura.temperatura  ?? null,
      umidade:      leitura.umidade      ?? null,
      // Converte o nome camelCase do frontend (umidadeSolo) para snake_case do backend
      umidade_solo: leitura.umidadeSolo  ?? null,
      luminosidade: leitura.luminosidade ?? null,
    })
    // Retorna null porque o frontend não usa o corpo da resposta para esta operação
    .then(() => null);

/**
 * Busca a serie temporal dos sensores para renderizar graficos.
 *
 * @param {string} estufaId  - ID da estufa
 * @param {number} horas     - Janela de historico em horas (1-168, default: 24)
 * @param {number} janela    - Granularidade em minutos (5-360, default: 30)
 */
// horas controla quantos dados passados serão exibidos; janela define a resolução do gráfico
export const getHistoricoTelemetria = (estufaId, horas = 24, janela = 30) =>
  api
    .get(`/estufas/${estufaId}/telemetria/historico`, { params: { horas, janela } })
    .then((res) => res.data);

/**
 * Busca a leitura mais recente dos sensores e atuadores para o dashboard ao vivo.
 * Retorna null se não houver leituras nos últimos 7 dias.
 *
 * Campos retornados:
 *   temperatura, umidade, umidade_solo, luminosidade (float | undefined)
 *   atuador_aquecimento, atuador_iluminacao, atuador_umidificador (0.0=off, 1.0=on | undefined)
 *   timestamp (string ISO 8601 | undefined)
 *
 * @param {string} estufaId - ID da estufa
 */
export const getLatestTelemetria = (estufaId) =>
  api
    .get(`/estufas/${estufaId}/telemetria/latest`)
    .then((res) => res.data);  // null se sem leituras, dict se houver
