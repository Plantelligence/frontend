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

// Importa a instância Axios com interceptores JWT — o token é adicionado automaticamente
import api from './client.js';

// Envia o histórico completo da conversa e recebe a próxima mensagem do assistente
// payload deve conter { messages: [{role, content}, ...] } seguindo o padrão OpenAI
export const sendChatMessage = (payload) =>
  api.post('/chat/', payload).then((res) => res.data);

// Solicita ao assistente que sugira parâmetros de cultivo com base em uma pergunta livre
// retorna um objeto com os campos do preset já preenchidos pela IA
export const requestPresetSuggestion = (question) =>
  // timeout estendido para 60s: chamadas de IA podem demorar no cold start do servidor
  api.post('/chat/preset-suggestion', { question }, { timeout: 60000 }).then((res) => res.data);
