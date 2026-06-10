// Testes — Mensagens de Erro Amigáveis
// Verifica a função getFriendlyErrorMessage, que transforma erros técnicos
// em mensagens que o usuário comum consegue entender.

import { describe, it, expect } from 'vitest';
import { getFriendlyErrorMessage } from '../../utils/errorMessages.js';

// Cria um objeto de erro parecido com o que o Axios retorna
function criarErroHttp(status, detalhe = null) {
  return {
    response: {
      status,
      data: detalhe ? { detail: detalhe } : {},
    },
  };
}

describe('Mensagens de Erro Amigáveis', () => {

  describe('Erros sem conexão com o servidor', () => {

    it('retorna mensagem de sem conexão quando não há status HTTP', () => {
      const erro = { response: undefined };
      const resultado = getFriendlyErrorMessage(erro, 'Erro genérico');
      expect(resultado).toContain('internet');
    });

  });

  describe('Erros de autenticação (401)', () => {

    it('retorna mensagem de sessão expirada para 401 genérico', () => {
      const erro = criarErroHttp(401);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/sessão|Sessão|expirou/i);
    });

    it('retorna mensagem específica de login para contexto "login"', () => {
      const erro = criarErroHttp(401);
      const resultado = getFriendlyErrorMessage(erro, 'fallback', 'login');
      expect(resultado).toMatch(/senha|e-mail/i);
    });

    it('retorna mensagem de código MFA para contexto "mfa"', () => {
      const erro = criarErroHttp(401);
      const resultado = getFriendlyErrorMessage(erro, 'fallback', 'mfa');
      expect(resultado).toMatch(/código|verificação/i);
    });

  });

  describe('Outros status HTTP', () => {

    it('retorna mensagem de permissão para 403', () => {
      const erro = criarErroHttp(403);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/permissão|autorizado/i);
    });

    it('retorna mensagem de recurso não encontrado para 404', () => {
      const erro = criarErroHttp(404);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/encontramos|encontrado/i);
    });

    it('retorna mensagem de timeout para 408', () => {
      const erro = criarErroHttp(408);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/demorou|instantes/i);
    });

    it('retorna mensagem de conflito para 409', () => {
      const erro = criarErroHttp(409);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/já existe/i);
    });

    it('retorna mensagem de dados inválidos para 422', () => {
      const erro = criarErroHttp(422);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/inválidos|campos/i);
    });

    it('retorna mensagem de muitas tentativas para 429', () => {
      const erro = criarErroHttp(429);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/tentativas|aguarde/i);
    });

    it('retorna mensagem de serviço indisponível para 500', () => {
      const erro = criarErroHttp(500);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/indisponível|minutos/i);
    });

  });

  describe('Mensagens da API (detail/message)', () => {

    it('exibe mensagem da API quando ela é segura (sem stack trace)', () => {
      const erro = criarErroHttp(400, 'Esse e-mail já está sendo usado.');
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toBe('Esse e-mail já está sendo usado.');
    });

    it('não exibe mensagem da API que contenha stack trace ou nome de exceção', () => {
      const erro = criarErroHttp(500, 'RuntimeError: connection refused to psycopg backend');
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      // Não deve retornar a mensagem técnica
      expect(resultado).not.toContain('RuntimeError');
    });

    it('status >= 500 retorna mensagem de servidor indisponível (não o fallback)', () => {
      // 999 é >= 500, então cai no handler de servidor — comportamento correto do serviço.
      const erro = criarErroHttp(999);
      const resultado = getFriendlyErrorMessage(erro, 'fallback');
      expect(resultado).toMatch(/indisponível|minutos/i);
    });

  });

});
