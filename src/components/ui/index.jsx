/**
 * Design System — Plantelligence Dashboard
 * Componentes reutilizáveis baseados no padrão da HelpPage.
 * Todas as telas pós-login devem usar estes componentes.
 */

import React from 'react';

// ── Tokens de estilo (referência única) ────────────────────────────────────────
export const DS = {
  card:        'rounded-2xl border border-stone-800/60 bg-stone-900/35',
  cardHover:   'rounded-2xl border border-stone-800/60 bg-stone-900/35 hover:border-stone-700/80 transition-all duration-200',
  cardInner:   'rounded-xl border border-stone-700/40 bg-stone-800/40',
  section:     'bg-[#0f0c0c]',
  sectionAlt:  'bg-[#0c0909]',
  divider:     'border-stone-800/40',
  textHeading: 'text-stone-100',
  textBody:    'text-stone-400',
  textMuted:   'text-stone-500',
  textLabel:   'text-[11px] font-semibold uppercase tracking-[0.22em] text-red-500',
  inputBase:   'rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20',
};

// ── PageHeader ─────────────────────────────────────────────────────────────────
export const PageHeader = ({ label, title, description, actions }) => (
  <div className={`mb-8 rounded-2xl border ${DS.divider} ${DS.cardInner} px-6 py-5`}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {label && <p className={DS.textLabel + ' mb-2'}>{label}</p>}
        <h1 className={`text-2xl font-bold ${DS.textHeading}`}>{title}</h1>
        {description && <p className={`mt-1 text-sm ${DS.textBody}`}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </div>
);

// ── SectionTitle ───────────────────────────────────────────────────────────────
export const SectionTitle = ({ label, title, description, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    {label && <p className={DS.textLabel + ' mb-2'}>{label}</p>}
    <h2 className={`text-xl font-bold ${DS.textHeading}`}>{title}</h2>
    {description && <p className={`mt-1 text-sm ${DS.textBody}`}>{description}</p>}
  </div>
);

// ── Card ───────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', hover = false, padding = true }) => (
  <div className={`${hover ? DS.cardHover : DS.card} ${padding ? 'p-5' : ''} ${className}`}>
    {children}
  </div>
);

// ── CardInner ──────────────────────────────────────────────────────────────────
export const CardInner = ({ children, className = '' }) => (
  <div className={`${DS.cardInner} p-4 ${className}`}>
    {children}
  </div>
);

// ── IconCard ───────────────────────────────────────────────────────────────────
export const IconCard = ({ icon, color, bg, title, description, className = '' }) => (
  <div className={`${DS.cardHover} p-5 ${className}`}>
    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg} mb-4`}>
      <i className={`fa-solid ${icon} text-base ${color}`} />
    </div>
    <h3 className={`text-sm font-semibold ${DS.textHeading} mb-1`}>{title}</h3>
    {description && <p className={`text-xs ${DS.textBody} leading-relaxed`}>{description}</p>}
  </div>
);

// ── MetricCard ─────────────────────────────────────────────────────────────────
export const MetricCard = ({ label, value, unit, icon, color, range, status }) => (
  <div className={`${DS.cardInner} p-4`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${DS.textMuted}`}>{label}</span>
      {icon && <i className={`fa-solid ${icon} text-xs ${color || DS.textMuted}`} />}
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-bold ${DS.textHeading}`}>{value}</span>
      {unit && <span className={`text-xs ${DS.textMuted}`}>{unit}</span>}
    </div>
    {range && <p className={`mt-1 text-[10px] ${DS.textMuted}`}>{range}</p>}
    {status && (
      <div className="mt-2 h-1 rounded-full bg-stone-700/50">
        <div className={`h-full rounded-full ${status.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: status.percent }} />
      </div>
    )}
  </div>
);

// ── StatCard ───────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, description, icon, color }) => (
  <div className={`${DS.card} p-5 text-center`}>
    {icon && <i className={`fa-solid ${icon} text-xl ${color || 'text-red-400'} mb-3 block`} />}
    <p className={`text-3xl font-bold ${DS.textHeading}`}>{value}</p>
    <p className={`text-xs font-semibold ${DS.textMuted} mt-1`}>{label}</p>
    {description && <p className={`text-[10px] ${DS.textMuted} mt-0.5`}>{description}</p>}
  </div>
);

// ── Badge ──────────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  red:     'border-red-500/30 bg-red-500/10 text-red-400',
  green:   'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  amber:   'border-amber-500/30 bg-amber-500/10 text-amber-400',
  blue:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
  stone:   'border-stone-700/50 bg-stone-800/40 text-stone-400',
  purple:  'border-purple-500/30 bg-purple-500/10 text-purple-400',
};

export const Badge = ({ children, color = 'stone', dot = false, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${BADGE_COLORS[color]} ${className}`}>
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${color === 'green' ? 'bg-emerald-400' : color === 'red' ? 'bg-red-400' : color === 'amber' ? 'bg-amber-400' : 'bg-stone-400'}`} />}
    {children}
  </span>
);

// ── InfoRow ────────────────────────────────────────────────────────────────────
export const InfoRow = ({ label, value, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 py-2.5 border-b border-stone-800/40 last:border-0 ${className}`}>
    <span className={`text-xs ${DS.textMuted} flex-shrink-0`}>{label}</span>
    <span className={`text-xs font-medium ${DS.textHeading} text-right`}>{value}</span>
  </div>
);

// ── EmptyState ─────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = 'fa-inbox', title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-800/60 bg-stone-900/40">
      <i className={`fa-solid ${icon} text-xl text-stone-500`} />
    </div>
    <div>
      <p className={`text-sm font-semibold ${DS.textHeading}`}>{title}</p>
      {description && <p className={`mt-1 text-xs ${DS.textBody}`}>{description}</p>}
    </div>
    {action}
  </div>
);

// ── SectionDivider ─────────────────────────────────────────────────────────────
export const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-6">
    <div className="h-px flex-1 bg-stone-800/60" />
    {label && <span className={`text-[10px] font-semibold uppercase tracking-widest ${DS.textMuted}`}>{label}</span>}
    <div className="h-px flex-1 bg-stone-800/60" />
  </div>
);

// ── ActionButton ───────────────────────────────────────────────────────────────
export const PrimaryBtn = ({ children, onClick, disabled, loading, type = 'button', className = '' }) => (
  <button type={type} onClick={onClick} disabled={disabled || loading}
    className={`inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}>
    {loading ? <><i className="fa-solid fa-circle-notch fa-spin text-xs" />Aguarde...</> : children}
  </button>
);

export const SecondaryBtn = ({ children, onClick, disabled, type = 'button', className = '' }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    className={`inline-flex items-center gap-2 rounded-xl border border-stone-700/60 px-5 py-2.5 text-sm font-medium text-stone-300 transition hover:border-stone-500 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}>
    {children}
  </button>
);

// ── Grid layouts ───────────────────────────────────────────────────────────────
export const Grid2 = ({ children, className = '' }) => (
  <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>
);

export const Grid3 = ({ children, className = '' }) => (
  <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>{children}</div>
);

export const Grid4 = ({ children, className = '' }) => (
  <div className={`grid gap-4 grid-cols-2 lg:grid-cols-4 ${className}`}>{children}</div>
);

// ── Input / Select padronizados ────────────────────────────────────────────────
export const Input = ({ label, ...props }) => (
  <label className="flex flex-col gap-1.5">
    {label && <span className={`text-[11px] font-semibold uppercase tracking-widest ${DS.textMuted}`}>{label}</span>}
    <input {...props} className={`${DS.inputBase} ${props.className || ''}`} />
  </label>
);

export const Select = ({ label, children, ...props }) => (
  <label className="flex flex-col gap-1.5">
    {label && <span className={`text-[11px] font-semibold uppercase tracking-widest ${DS.textMuted}`}>{label}</span>}
    <select {...props} className={`${DS.inputBase} ${props.className || ''}`}>
      {children}
    </select>
  </label>
);

export const Textarea = ({ label, ...props }) => (
  <label className="flex flex-col gap-1.5">
    {label && <span className={`text-[11px] font-semibold uppercase tracking-widest ${DS.textMuted}`}>{label}</span>}
    <textarea {...props} className={`${DS.inputBase} resize-none ${props.className || ''}`} />
  </label>
);
