/**
 * Serviço do site institucional — formulário de contato público.
 *
 * Esta é a única rota do sistema que não exige autenticação.
 * O backend envia o conteúdo por e-mail para a equipe da Plantelligence.
 */

// Importa a instância Axios compartilhada — mesmo sem autenticação, usa a mesma base URL
import api from './client.js';

// Envia os dados do formulário de contato para o servidor
// payload deve conter nome, e-mail, assunto e mensagem do visitante
export const sendContactRequest = (payload) =>
  api.post('/site/contact', payload).then((res) => res.data);
