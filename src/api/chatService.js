import api from './client.js';

// Chat IA para suporte N1 do usuário autenticado
// Lista conversas anteriores do usuario.
export const getChatSessions = () =>
  api.get('/chat/sessions').then((res) => res.data);

// Carrega mensagens de uma conversa especifica.
export const getChatMessages = (sessionId) =>
  api.get(`/chat/sessions/${sessionId}/messages`).then((res) => res.data);

// Envia nova pergunta para o assistente.
export const sendChatMessage = (payload) =>
  api.post('/chat/messages', payload).then((res) => res.data);

// Diagnóstico rápido contextual por estufa
// Solicita diagnostico com contexto da estufa selecionada.
export const requestQuickDiagnosis = (greenhouseId, payload) =>
  api.post(`/chat/diagnosis/${greenhouseId}`, payload).then((res) => res.data);
