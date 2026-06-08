/**
 * Serviço de Dispositivos — comunicação com a API de dispositivos IoT.
 *
 * Cada estufa pode ter vários dispositivos cadastrados (sensores e atuadores).
 * Ao criar um dispositivo, o sistema registra ele automaticamente no Azure IoT Hub
 * e retorna as credenciais MQTT que devem ser configuradas no ESP32 (boot.py).
 *
 * Funções disponíveis:
 *   listDevices      — lista todos os dispositivos de uma estufa
 *   createDevice     — cria um novo dispositivo e registra no IoT Hub
 *   updateDevice     — renomeia ou ativa/desativa um dispositivo existente
 *   deleteDevice     — remove o dispositivo do sistema e do IoT Hub
 *   regenerarTokenDevice — gera um novo SAS Token (usado quando o token expira após 1 ano)
 */

import api from './client.js';

/**
 * Converte os campos retornados pelo backend (snake_case em português)
 * para o padrão usado no frontend (camelCase em inglês).
 * Isso evita que a interface precise conhecer detalhes do banco de dados.
 */
const mapDevice = (item) => ({
  id: item?.id,
  name: item?.nome ?? item?.name ?? 'Dispositivo',
  type: item?.tipo ?? item?.type ?? '',
  identifier: item?.identificador ?? item?.identifier ?? '',
  active: item?.ativo ?? item?.active ?? true,
  estufaId: item?.estufa_id ?? item?.estufaId ?? null,
  // credenciais do Azure IoT Hub — retornadas apenas na criação e na renovação do token
  iothubDeviceId: item?.iothub_device_id ?? null,
  iothubSasToken: item?.iothub_sas_token ?? null,
  mqttServer:    item?.mqtt_server ?? null,
  mqttPort:      item?.mqtt_port ?? null,
  mqttUsername:  item?.mqtt_username ?? null,
  mqttTopicPub:  item?.mqtt_topic_pub ?? null,
  mqttTopicSub:  item?.mqtt_topic_sub ?? null,
});

/** Retorna todos os dispositivos cadastrados em uma estufa específica. */
export const listDevices = (estufaId) =>
  api.get(`/estufas/${estufaId}/dispositivos`).then((res) => ({
    devices: (res.data?.dispositivos ?? []).map(mapDevice),
  }));

/**
 * Cria um novo dispositivo vinculado à estufa.
 * O backend registra o dispositivo no Azure IoT Hub e retorna as credenciais
 * MQTT (servidor, porta, usuário, SAS Token) para configurar no ESP32.
 */
export const createDevice = (estufaId, payload) =>
  api.post(`/estufas/${estufaId}/dispositivos`, {
    nome: payload?.name,
    tipo: payload?.type,
    identificador: payload?.identifier || undefined,
  }).then((res) => ({ device: mapDevice(res.data) }));

/** Atualiza o nome ou o status ativo/inativo de um dispositivo já cadastrado. */
export const updateDevice = (estufaId, deviceId, payload) =>
  api.patch(`/estufas/${estufaId}/dispositivos/${deviceId}`, {
    nome: payload?.name,
    ativo: payload?.active,
  }).then((res) => ({ device: mapDevice(res.data) }));

/** Remove o dispositivo do banco de dados e do registro no Azure IoT Hub. */
export const deleteDevice = (estufaId, deviceId) =>
  api.delete(`/estufas/${estufaId}/dispositivos/${deviceId}`).then(() => null);

/**
 * Solicita a geração de um novo SAS Token para o dispositivo.
 * O SAS Token é a "senha" que o ESP32 usa para se conectar ao IoT Hub via MQTT.
 * Validade padrão: 1 ano. Use esta função quando o token antigo expirar.
 */
export const regenerarTokenDevice = (estufaId, deviceId) =>
  api.post(`/estufas/${estufaId}/dispositivos/${deviceId}/regenerar-token`)
    .then((res) => mapDevice(res.data));
