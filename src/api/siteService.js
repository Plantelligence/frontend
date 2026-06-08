/**
 * Serviço do site institucional — formulário de contato público.
 *
 * Esta é a única rota do sistema que não exige autenticação.
 * O backend envia o conteúdo por e-mail para a equipe da Plantelligence.
 */

import api from './client.js';

export const sendContactRequest = (payload) =>
  api.post('/site/contact', payload).then((res) => res.data);
