/**
 * Button - Componente de botão genérico reutilizável.
 *
 * Encapsula o elemento <button> com estilos padrão do design system.
 * Aceita variantes (primary, secondary, danger) e estados (loading, disabled).
 * Todas as páginas que precisam de botão devem usar este componente
 * para garantir consistência visual.
 */

// Componente de botao reutilizavel com suporte a diferentes variantes e estados.
import React from 'react';
// clsx: utilitário para combinar classes condicionalmente sem strings manuais
import clsx from 'clsx';

// Estilos base aplicados a todas as variantes do botão
// active:translate-y-px: feedback visual de clique (afunda levemente)
// disabled:opacity-60: claramente desabilitado sem precisar de lógica extra
// border-transparent removido do base para não conflitar com border-stone-300 do secondary
// cada variante define sua própria border-color
const baseStyles =
  'inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition shadow-sm active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export const Button = ({
  children,
  // Variante padrão: primária (vermelho gradiente)
  variant = 'primary',
  // className extra para sobrescrever estilos pontualmente
  className,
  // Repassa todos os outros props nativos do <button> (onClick, type, disabled, etc.)
  ...rest
}) => {
  // Mapeamento de variantes para classes Tailwind específicas
  const variants = {
    // Primary: gradiente vermelho — ação principal da tela (borda transparente)
    primary: 'border-transparent bg-gradient-to-r from-red-700 to-red-600 text-primary-foreground hover:from-red-600 hover:to-red-500',
    // Secondary: fundo branco com borda visível — ação secundária ou cancelamento
    secondary:
      'border-stone-300 bg-white text-slate-700 hover:bg-stone-100 hover:border-stone-400 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-100 dark:hover:bg-stone-700 dark:hover:border-stone-500 focus-visible:outline-stone-300',
    // Danger: vermelho sólido mais intenso — para ações destrutivas como excluir (borda transparente)
    danger: 'border-transparent bg-rose-700 text-white hover:bg-rose-600 focus-visible:outline-rose-300'
  };

  return (
    // clsx combina: estilos base + variante + className personalizado
    <button className={clsx(baseStyles, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
};
