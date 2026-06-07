/**
 * DashUI — Sistema de design compartilhado para todas as telas pós-login.
 * Baseado na estética da HelpPage (referência de qualidade).
 *
 * TOKENS DE DESIGN:
 *   bg-[#0c0909] / bg-[#0f0c0c] — fundos de seção
 *   stone-900/35 + stone-800/60 — cards
 *   stone-100 / stone-400 / stone-500 — hierarquia de texto
 *   red-500 / red-400 — accent
 */

import React from 'react';

// ── Tokens tipados como constantes (use via className diretamente) ──────────────
export const DS = {
  // Fundos
  pageBg:      'bg-[#0c0909] dark:bg-[#0c0909]',
  sectionAlt:  'bg-[#0f0c0c]',
  cardBg:      'rounded-2xl border border-stone-800/60 bg-stone-900/35',
  cardInner:   'rounded-xl border border-stone-700/40 bg-stone-800/40',
  cardHover:   'hover:border-stone-700/80 transition-all',
  // Dividers
  divider:     'border-stone-800/40',
  // Texto
  label:       'text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500',
  h1:          'text-3xl sm:text-4xl font-bold text-white',
  h2:          'text-xl font-semibold text-stone-100',
  h3:          'text-base font-semibold text-stone-100',
  h4:          'text-sm font-semibold text-stone-100',
  body:        'text-sm text-stone-400 leading-relaxed',
  muted:       'text-xs text-stone-500',
  // Badges
  badge:       'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
};

// ── PageLabel — etiqueta vermelha acima dos títulos ────────────────────────────
export const PageLabel = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-3">
    {children}
  </p>
);

// ── PageHeader — cabeçalho padrão de seção/página ─────────────────────────────
export const PageHeader = ({ label, title, subtitle, children }) => (
  <div className="mb-8">
    {label && <PageLabel>{label}</PageLabel>}
    <h1 className="text-2xl sm:text-3xl font-bold text-stone-100 mb-2">{title}</h1>
    {subtitle && <p className="text-sm text-stone-400 max-w-2xl">{subtitle}</p>}
    {children}
  </div>
);

// ── SectionHeader — divisor de seção com ícone ────────────────────────────────
export const SectionHeader = ({ icon, title, count }) => (
  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-800/50">
    {icon && (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10">
        <i className={`fa-solid ${icon} text-red-400 text-base`} />
      </div>
    )}
    <h2 className="text-base font-semibold text-stone-100 flex-1">{title}</h2>
    {count !== undefined && (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-stone-400">
        {count}
      </span>
    )}
  </div>
);

// ── DashCard — card padrão ─────────────────────────────────────────────────────
export const DashCard = ({ children, className = '', hover = true, padding = true }) => (
  <div className={`rounded-2xl border border-stone-800/60 bg-stone-900/35 ${padding ? 'p-5' : ''} ${hover ? 'hover:border-stone-700/80 transition-all' : ''} ${className}`}>
    {children}
  </div>
);

// ── DashInnerCard — card aninhado (sub-elemento dentro de DashCard) ───────────
export const DashInnerCard = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-stone-700/40 bg-stone-800/40 p-3 ${className}`}>
    {children}
  </div>
);

// ── DashMetric — bloco de métrica (temperatura, umidade, etc.) ────────────────
export const DashMetric = ({ label, value, unit, range, color = 'text-red-400' }) => (
  <div className="rounded-xl border border-stone-700/40 bg-stone-800/40 p-3">
    <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${color}`}>{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-stone-100">{value}</span>
      {unit && <span className="text-xs text-stone-500">{unit}</span>}
    </div>
    {range && <p className="text-[10px] text-stone-600 mt-1">{range}</p>}
  </div>
);

// ── DashBadge — badge de status ───────────────────────────────────────────────
const badgeColors = {
  green:   'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  amber:   'border-amber-500/30 bg-amber-500/10 text-amber-400',
  red:     'border-red-500/30 bg-red-500/10 text-red-400',
  blue:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
  purple:  'border-purple-500/30 bg-purple-500/10 text-purple-400',
  stone:   'border-stone-700 bg-stone-800/60 text-stone-400',
};

export const DashBadge = ({ color = 'stone', children, dot }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeColors[color]}`}>
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${color === 'green' ? 'bg-emerald-400' : color === 'red' ? 'bg-red-400' : 'bg-amber-400'}`} />}
    {children}
  </span>
);

// ── DashStatCard — card de estatística com ícone ──────────────────────────────
export const DashStatCard = ({ icon, iconColor = 'text-red-400', iconBg = 'bg-red-500/10', label, value, description }) => (
  <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-5 hover:border-stone-700/80 transition-all">
    {icon && (
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} mb-4`}>
        <i className={`fa-solid ${icon} text-base ${iconColor}`} />
      </div>
    )}
    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mb-1">{label}</p>
    <p className="text-3xl font-bold text-stone-100">{value}</p>
    {description && <p className="text-xs text-stone-500 mt-1">{description}</p>}
  </div>
);

// ── DashInfoBox — caixa de informação/aviso ───────────────────────────────────
const infoColors = {
  blue:  'border-blue-500/30 bg-blue-500/10 text-blue-300',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  red:   'border-red-500/30 bg-red-500/10 text-red-300',
};

export const DashInfoBox = ({ icon = 'fa-circle-info', color = 'blue', children }) => (
  <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${infoColors[color]}`}>
    <i className={`fa-solid ${icon} mt-0.5 flex-shrink-0 text-sm`} />
    <div className="min-w-0 text-sm">{children}</div>
  </div>
);

// ── DashEmptyState — estado vazio ─────────────────────────────────────────────
export const DashEmptyState = ({ icon = 'fa-inbox', title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-800/60 border border-stone-700/40">
      <i className={`fa-solid ${icon} text-xl text-stone-500`} />
    </div>
    {title && <p className="text-sm font-semibold text-stone-300">{title}</p>}
    {description && <p className="text-xs text-stone-500 max-w-xs">{description}</p>}
    {action}
  </div>
);

// ── DashSelectCard — card selecionável (ex: tipos de cultivo) ─────────────────
export const DashSelectCard = ({ selected, onClick, title, description, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`rounded-2xl border p-4 text-left transition-all w-full ${
      selected
        ? 'border-red-500/70 bg-red-500/8 ring-1 ring-red-500/40'
        : 'border-stone-800/60 bg-stone-900/35 hover:border-stone-700/60 hover:bg-stone-900/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <p className={`text-sm font-semibold mb-1 ${selected ? 'text-stone-100' : 'text-stone-200'}`}>{title}</p>
    {description && <p className={`text-xs ${selected ? 'text-stone-400' : 'text-stone-500'}`}>{description}</p>}
  </button>
);

// ── DashInput — input padrão ───────────────────────────────────────────────────
export const inputClass = 'rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 disabled:opacity-50';

// ── DashLabel — label de campo ─────────────────────────────────────────────────
export const DashLabel = ({ children, optional }) => (
  <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">
    {children}
    {optional && <span className="ml-1 normal-case text-stone-600">(opcional)</span>}
  </span>
);

// ── DashGrid — grid responsivo padrão ─────────────────────────────────────────
export const DashGrid = ({ cols = 3, children, className = '' }) => {
  const colMap = { 1: 'grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' };
  return (
    <div className={`grid gap-4 ${colMap[cols] || colMap[3]} ${className}`}>
      {children}
    </div>
  );
};
