/**
 * InputField - Campo de input com label integrado.
 *
 * Componente wrapper que combina <label> + <input> com estilos consistentes.
 * Aceita todas as props nativas do <input> via spread.
 * Usado principalmente nos formulários de autenticação (Login, Register).
 */

import React from 'react';
// clsx: utilitário para combinar classes CSS condicionalmente
import clsx from 'clsx';

// Campo de entrada padrao para formularios com estilo consistente.
export const InputField = ({
  // Texto exibido como rótulo acima do input
  label,
  // Tipo do input: 'text', 'password', 'email', etc.
  type = 'text',
  // Atributo name para identificar o campo em formulários HTML
  name,
  // Valor controlado pelo estado do componente pai
  value,
  // Callback chamado a cada mudança de valor
  onChange,
  // Sugestão de preenchimento automático do navegador (ex.: 'email', 'current-password')
  autoComplete,
  // Torna o campo obrigatório na validação nativa do HTML
  required,
  // Classes adicionais para o elemento <label> externo
  labelClassName,
  // Classes adicionais para o elemento <input>
  className,
  // Repassa todos os outros atributos nativos do input (placeholder, disabled, maxLength, etc.)
  ...rest
}) => (
  // label como wrapper: clicar no texto do rótulo foca o input automaticamente
  <label className={clsx('flex flex-col gap-1 text-sm text-slate-200', labelClassName)}>
    {/* Texto do rótulo do campo */}
    <span>{label}</span>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      required={required}
      // focus:ring-red-500/40: anel de foco vermelho semitransparente seguindo a identidade visual
      className={clsx(
        'w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 dark:text-stone-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/40',
        className
      )}
      {...rest}
    />
  </label>
);
