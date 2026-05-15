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
      temperatura:  leitura.temperatura  ?? null,
      umidade:      leitura.umidade      ?? null,
      umidade_solo: leitura.umidadeSolo  ?? null,
      luminosidade: leitura.luminosidade ?? null,
    })
    .then(() => null);
