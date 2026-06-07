/**
 * passwordPolicy.js - Validação de força de senha no frontend.
 *
 * Define e valida as regras de senha do Plantelligence:
 *   - Mínimo 8 caracteres
 *   - Pelo menos 1 letra maiúscula
 *   - Pelo menos 1 número
 *   - Pelo menos 1 caractere especial
 *
 * Usado nos formulários de cadastro, primeiro acesso e troca de senha
 * para validação em tempo real antes de enviar ao backend.
 */

// Política de senha usada tanto na validação client-side quanto no atributo pattern dos inputs.

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const passwordPolicy = {
  regex: PASSWORD_REGEX,
  message:
    'A senha precisa ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.'
};

export const isPasswordCompliant = (value) => PASSWORD_REGEX.test(value ?? '');
export const passwordPattern = PASSWORD_REGEX.source;
