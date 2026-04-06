import api from './client.js';

// Envia nova pergunta para o assistente.
export const sendChatMessage = (payload) =>
  api.post('/chat/', payload).then((res) => res.data);

// Solicita sugestao de parametros para cultivo personalizado.
export const requestPresetSuggestion = (question) =>
  api.post('/chat/preset-suggestion', { question }).then((res) => res.data);
