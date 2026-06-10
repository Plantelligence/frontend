// Testes — Política de Senhas
// Verifica a função isPasswordCompliant, que valida se uma senha
// atende aos critérios de segurança exigidos pelo sistema.

import { describe, it, expect } from 'vitest';
import { isPasswordCompliant, passwordPolicy } from '../../utils/passwordPolicy.js';

describe('Política de Senhas', () => {

  describe('isPasswordCompliant — senhas válidas', () => {

    it('aceita senha com todos os requisitos atendidos', () => {
      expect(isPasswordCompliant('Senha@Forte123')).toBe(true);
    });

    it('aceita senha com caractere especial diferente do @', () => {
      expect(isPasswordCompliant('Planti#Estufa99')).toBe(true);
    });

    it('aceita senha com mais de 8 caracteres', () => {
      expect(isPasswordCompliant('MinhaSenh@12345')).toBe(true);
    });

  });

  describe('isPasswordCompliant — senhas inválidas', () => {

    it('rejeita senha sem letra maiúscula', () => {
      expect(isPasswordCompliant('senha@fraca123')).toBe(false);
    });

    it('rejeita senha sem letra minúscula', () => {
      expect(isPasswordCompliant('SENHA@FORTE123')).toBe(false);
    });

    it('rejeita senha sem número', () => {
      expect(isPasswordCompliant('Senha@SemNumero')).toBe(false);
    });

    it('rejeita senha sem caractere especial', () => {
      expect(isPasswordCompliant('SenhaSemEspecial1')).toBe(false);
    });

    it('rejeita senha com menos de 8 caracteres', () => {
      expect(isPasswordCompliant('Ab@1234')).toBe(false);
    });

    it('rejeita string vazia', () => {
      expect(isPasswordCompliant('')).toBe(false);
    });

    it('retorna false para undefined (sem travar a aplicação)', () => {
      expect(isPasswordCompliant(undefined)).toBe(false);
    });

  });

  describe('passwordPolicy — objeto de configuração', () => {

    it('exporta o objeto passwordPolicy com regex e message', () => {
      expect(passwordPolicy).toHaveProperty('regex');
      expect(passwordPolicy).toHaveProperty('message');
    });

    it('a mensagem descreve os requisitos mínimos para o usuário', () => {
      expect(passwordPolicy.message).toContain('8 caracteres');
    });

  });

});
