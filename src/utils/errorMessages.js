const TECHNICAL_MESSAGE_PATTERN = /(traceback|exception|sql|stack|runtimeerror|internal server error|backend|fastapi|uvicorn|psycopg|axios|connection refused)/i;

const extractApiMessage = (error) => {
  const detail = error?.response?.data?.detail;
  const message = error?.response?.data?.message;

  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  return null;
};

const normalizeKnownUserMessages = (message) => {
  if (!message) {
    return message;
  }

  const lowered = String(message).toLowerCase();
  if (lowered.includes('usuario esta bloqueado') || lowered.includes('usuário está bloqueado')) {
    return 'Seu usuário está bloqueado. Contate o administrador da organização.';
  }
  if (lowered.includes('esse e-mail já está sendo usado')) {
    return 'Esse e-mail já está sendo usado.';
  }
  if (lowered.includes('usuário ou senha incorretos')) {
    return 'Usuário ou senha incorretos.';
  }
  return message;
};

const getStatusFallback = (status, context) => {
  if (!status) {
    return 'Sem conexão no momento. Verifique sua internet e tente novamente.';
  }

  if (status === 401) {
    if (context === 'login') {
      return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
    }
    if (context === 'mfa') {
      return 'Código de verificação inválido ou expirado. Gere um novo código e tente novamente.';
    }
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }

  if (status === 403) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (status === 404) {
    return 'Não encontramos o recurso solicitado. Atualize a página e tente novamente.';
  }

  if (status === 408 || status === 504) {
    return 'A solicitação demorou mais que o esperado. Tente novamente em instantes.';
  }

  if (status === 409) {
    return 'Já existe um registro com esses dados. Revise e tente novamente.';
  }

  if (status === 422) {
    if (context === 'mfa') {
      return 'Código de verificação inválido. Confira os 6 dígitos e tente novamente.';
    }
    return 'Alguns dados informados estão inválidos. Revise os campos e tente novamente.';
  }

  if (status === 429) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
  }

  if (status >= 500) {
    return 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
  }

  return null;
};

export const getFriendlyErrorMessage = (error, fallback, context = 'default') => {
  const status = error?.response?.status;
  const apiMessage = normalizeKnownUserMessages(extractApiMessage(error));

  if (apiMessage && !TECHNICAL_MESSAGE_PATTERN.test(apiMessage)) {
    return apiMessage;
  }

  return getStatusFallback(status, context) || fallback;
};
