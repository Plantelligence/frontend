import api from './client.js';

// Busca a chave publica usada para criptografia no cliente.
export const getPublicKey = () => api.get('/crypto/public-key').then((res) => res.data);

// Envia payload criptografado para simulacao/validacao no backend.
export const simulateSecureMessage = (payload) =>
  api.post('/crypto/simulate', payload).then((res) => res.data);
