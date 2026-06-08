/**
 * Serviço do assistente de chat com IA.
 *
 * O chat usa o backend como proxy para o OpenRouter (compatível com a API da OpenAI).
 * O histórico completo da conversa é enviado a cada mensagem — o backend não armazena
 * nada, por isso o frontend mantém o histórico em memória durante a sessão.
 *
 * Funções:
 *   sendChatMessage        — envia o histórico e recebe a resposta do assistente
 *   requestPresetSuggestion — solicita parâmetros de cultivo sugeridos por IA a partir
 *                             de uma descrição livre (ex.: "quero cultivar shiitake")
 */

import api from './client.js';

export const sendChatMessage = (payload) =>
  api.post('/chat/', payload).then((res) => res.data);

export const requestPresetSuggestion = (question) =>
  api.post('/chat/preset-suggestion', { question }).then((res) => res.data);
