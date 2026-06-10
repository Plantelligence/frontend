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

// Regex que combina todas as regras da política de senha em uma única expressão
// (?=.*[a-z]) = pelo menos uma letra minúscula
// (?=.*[A-Z]) = pelo menos uma letra maiúscula
// (?=.*\d)    = pelo menos um dígito
// (?=.*[^A-Za-z0-9]) = pelo menos um caractere especial (qualquer coisa que não seja letra ou número)
// .{8,} = mínimo de 8 caracteres
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Exporta a política como objeto para que os formulários possam acessar o regex e a mensagem
export const passwordPolicy = {
  regex: PASSWORD_REGEX,
  // Mensagem exibida ao usuário quando a senha não atende aos critérios
  message:
    'A senha precisa ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.'
};

// Função utilitária que verifica se uma senha está em conformidade com a política
// retorna true se válida, false se não atende algum critério
export const isPasswordCompliant = (value) => PASSWORD_REGEX.test(value ?? '');
// Exporta o source do regex para usar diretamente no atributo pattern dos inputs HTML
export const passwordPattern = PASSWORD_REGEX.source;
