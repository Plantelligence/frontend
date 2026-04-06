import api from './client.js';

export const sendContactRequest = (payload) =>
  api.post('/site/contact', payload).then((res) => res.data);
