import api from './client.js';

// Registro e gestão de sensores da estufa
// Lista sensores cadastrados na estufa.
export const listGreenhouseSensors = (greenhouseId) =>
  api.get(`/greenhouse/${greenhouseId}/sensors`).then((res) => res.data);

// Cria um novo sensor para a estufa.
export const createGreenhouseSensor = (greenhouseId, payload) =>
  api.post(`/greenhouse/${greenhouseId}/sensors`, payload).then((res) => res.data);

// Atualiza configuracao de sensor existente.
export const updateGreenhouseSensor = (greenhouseId, sensorId, payload) =>
  api.put(`/greenhouse/${greenhouseId}/sensors/${sensorId}`, payload).then((res) => res.data);

// Remove sensor da estufa.
export const deleteGreenhouseSensor = (greenhouseId, sensorId) =>
  api.delete(`/greenhouse/${greenhouseId}/sensors/${sensorId}`).then((res) => res.data);

// Registro e gestão de atuadores da estufa
// Lista atuadores vinculados a estufa.
export const listGreenhouseActuators = (greenhouseId) =>
  api.get(`/greenhouse/${greenhouseId}/actuators`).then((res) => res.data);

// Cria novo atuador na estufa.
export const createGreenhouseActuator = (greenhouseId, payload) =>
  api.post(`/greenhouse/${greenhouseId}/actuators`, payload).then((res) => res.data);

// Atualiza dados de um atuador.
export const updateGreenhouseActuator = (greenhouseId, actuatorId, payload) =>
  api.put(`/greenhouse/${greenhouseId}/actuators/${actuatorId}`, payload).then((res) => res.data);

// Exclui um atuador da estufa.
export const deleteGreenhouseActuator = (greenhouseId, actuatorId) =>
  api.delete(`/greenhouse/${greenhouseId}/actuators/${actuatorId}`).then((res) => res.data);

// Parâmetros gerais da estufa (pontos de ajuste, intervalos, políticas de acionamento)
// Busca parametros gerais aplicados a estufa.
export const getGreenhouseParameters = (greenhouseId) =>
  api.get(`/greenhouse/${greenhouseId}/parameters`).then((res) => res.data);

// Atualiza parametros gerais da estufa.
export const updateGreenhouseParameters = (greenhouseId, payload) =>
  api.put(`/greenhouse/${greenhouseId}/parameters`, payload).then((res) => res.data);
