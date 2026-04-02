// Componente de botao reutilizavel com suporte a diferentes variantes e estados.
import React from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2.5 text-sm font-semibold transition shadow-sm active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export const Button = ({
  children,
  variant = 'primary',
  className,
  ...rest
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-red-700 to-red-600 text-primary-foreground hover:from-red-600 hover:to-red-500',
    secondary:
      'border-stone-600 bg-stone-800 text-stone-100 hover:border-stone-500 hover:bg-stone-700 focus-visible:outline-stone-300',
    danger: 'bg-rose-700 text-white hover:bg-rose-600 focus-visible:outline-rose-300'
  };

  return (
    <button className={clsx(baseStyles, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
};
