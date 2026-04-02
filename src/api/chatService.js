import api from './client.js';

// Chat IA para suporte N1 do usuário autenticado
export const getChatSessions = () =>
  api.get('/chat/sessions').then((res) => res.data);

export const getChatMessages = (sessionId) =>
  api.get(`/chat/sessions/${sessionId}/messages`).then((res) => res.data);

export const sendChatMessage = (payload) =>
  api.post('/chat/messages', payload).then((res) => res.data);

// Diagnóstico rápido contextual por estufa
export const requestQuickDiagnosis = (greenhouseId, payload) =>
  api.post(`/chat/diagnosis/${greenhouseId}`, payload).then((res) => res.data);
