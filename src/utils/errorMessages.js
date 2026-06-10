/**
 * errorMessages.js - Mensagens de erro amigáveis para o usuário.
 *
 * Converte erros técnicos da API em mensagens legíveis em português.
 * Função principal: getFriendlyErrorMessage(error, fallback)
 *
 * Hierarquia de extração:
 *   1. error.response.data.message (mensagem do backend FastAPI)
 *   2. error.response.data.detail  (mensagem técnica da API)
 *   3. error.message               (erro genérico do Axios)
 *   4. fallback                    (mensagem padrão passada pelo chamador)
 */

// Padrão para detectar mensagens técnicas que não devem ser exibidas ao usuário
// inclui nomes de frameworks, termos de banco de dados e palavras de erro interno
const TECHNICAL_MESSAGE_PATTERN = /(traceback|exception|sql|stack|runtimeerror|internal server error|backend|fastapi|uvicorn|psycopg|axios|connection refused)/i;

// Extrai a primeira mensagem disponível da resposta HTTP do servidor
const extractApiMessage = (error) => {
  // 'detail' é o campo padrão de erros da validação do FastAPI (Pydantic)
  const detail = error?.response?.data?.detail;
  // 'message' é o campo personalizado usado nas respostas de negócio do backend
  const message = error?.response?.data?.message;

  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  // Nenhuma mensagem encontrada na resposta
  return null;
};

// Converte mensagens conhecidas do backend para textos mais claros em português
const normalizeKnownUserMessages = (message) => {
  if (!message) {
    return message;
  }

  const lowered = String(message).toLowerCase();
  // Mensagem de bloqueio de conta — orienta o usuário a contatar o admin
  if (lowered.includes('usuario esta bloqueado') || lowered.includes('usuário está bloqueado')) {
    return 'Seu usuário está bloqueado. Contate o administrador da organização.';
  }
  // Conflito de e-mail no cadastro
  if (lowered.includes('esse e-mail já está sendo usado')) {
    return 'Esse e-mail já está sendo usado.';
  }
  // Credenciais incorretas no login
  if (lowered.includes('usuário ou senha incorretos')) {
    return 'Usuário ou senha incorretos.';
  }
  // Mensagem não reconhecida — retorna como veio
  return message;
};

// Retorna uma mensagem de fallback baseada no código HTTP quando a API não enviou mensagem útil
const getStatusFallback = (status, context) => {
  // Sem status: provavelmente erro de rede ou timeout
  if (!status) {
    return 'Sem conexão no momento. Verifique sua internet e tente novamente.';
  }

  if (status === 401) {
    // Contexto de login: credenciais erradas
    if (context === 'login') {
      return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
    }
    // Contexto de MFA: código inválido ou expirado
    if (context === 'mfa') {
      return 'Código de verificação inválido ou expirado. Gere um novo código e tente novamente.';
    }
    // Sessão expirada em qualquer outro contexto
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }

  if (status === 403) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (status === 404) {
    return 'Não encontramos o recurso solicitado. Atualize a página e tente novamente.';
  }

  // 408: timeout do servidor; 504: gateway timeout
  if (status === 408 || status === 504) {
    return 'A solicitação demorou mais que o esperado. Tente novamente em instantes.';
  }

  if (status === 409) {
    return 'Já existe um registro com esses dados. Revise e tente novamente.';
  }

  if (status === 422) {
    // 422 em contexto MFA: código TOTP fora do formato esperado
    if (context === 'mfa') {
      return 'Código de verificação inválido. Confira os 6 dígitos e tente novamente.';
    }
    // 422 geral: validação de campos falhou no backend
    return 'Alguns dados informados estão inválidos. Revise os campos e tente novamente.';
  }

  // Muitas tentativas — o backend aplicou rate limiting
  if (status === 429) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
  }

  // Qualquer erro 5xx indica falha interna no servidor
  if (status >= 500) {
    return 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
  }

  // Código HTTP não mapeado — sem fallback específico
  return null;
};

// Função principal: recebe o erro do Axios e retorna uma string amigável para o usuário
export const getFriendlyErrorMessage = (error, fallback, context = 'default') => {
  const status = error?.response?.status;
  // Tenta extrair e normalizar a mensagem direta da API
  const apiMessage = normalizeKnownUserMessages(extractApiMessage(error));

  // Usa a mensagem da API apenas se não parecer técnica/interna
  if (apiMessage && !TECHNICAL_MESSAGE_PATTERN.test(apiMessage)) {
    return apiMessage;
  }

  // Erro JS puro (new Error('...')) sem response HTTP — usa a mensagem diretamente
  if (!error?.response && error?.message && !TECHNICAL_MESSAGE_PATTERN.test(error.message)) {
    return error.message;
  }

  // Tenta o fallback por status HTTP; se não houver, usa o fallback do chamador
  return getStatusFallback(status, context) || fallback;
};
