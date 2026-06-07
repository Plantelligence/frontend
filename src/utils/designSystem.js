/**
 * Design System — Plantelligence
 * Tokens compartilhados para consistência visual entre todas as telas pós-login.
 * Referência visual: HelpPage (tela de Ajuda e Documentação).
 *
 * USO: import { ds } from '../utils/designSystem.js';
 *      <div className={ds.card}>...</div>
 */

export const ds = {
  // ── Fundos de seção ─────────────────────────────────────────────────────────
  pageBg:      'bg-[#0c0909]',          // fundo primário (igual landing page)
  sectionAlt:  'bg-[#0f0c0c]',          // fundo alternado entre seções
  divider:     'border-t border-stone-800/40',

  // ── Cards ───────────────────────────────────────────────────────────────────
  card:        'rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6',
  cardHover:   'rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6 transition-all hover:border-stone-700/80 hover:-translate-y-[2px]',
  cardSm:      'rounded-xl border border-stone-800/60 bg-stone-900/35 p-4',
  cardSelected:'rounded-2xl border border-red-500/50 bg-red-600/10 p-6 ring-1 ring-red-500/30',
  cardNested:  'rounded-xl border border-stone-700/40 bg-stone-800/40 p-4',

  // ── Tipografia ──────────────────────────────────────────────────────────────
  label:     'text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500',  // rótulo de seção
  h1:        'text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-white',
  h2:        'text-3xl sm:text-4xl font-bold text-white leading-tight',
  h2sm:      'text-2xl font-bold text-white leading-tight',
  h3:        'text-base font-semibold text-stone-100',
  h3sm:      'text-sm font-semibold text-stone-100',
  body:      'text-stone-400 leading-relaxed',
  bodySm:    'text-sm text-stone-400 leading-relaxed',
  muted:     'text-xs text-stone-500',
  statNum:   'text-3xl font-bold text-white',

  // ── Inputs ──────────────────────────────────────────────────────────────────
  input:     'rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20',
  inputSm:   'rounded-lg border border-stone-700/50 bg-stone-800/50 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/50',
  select:    'rounded-xl border border-stone-700/60 bg-stone-800/60 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-red-500/60',
  textarea:  'w-full resize-none rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20',

  // ── Botões ──────────────────────────────────────────────────────────────────
  btnPrimary:   'inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
  btnSecondary: 'inline-flex items-center gap-2 rounded-xl border border-stone-700/60 px-6 py-3 text-sm font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white',
  btnGhost:     'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-stone-400 transition hover:bg-stone-800/60 hover:text-stone-200',
  btnDanger:    'inline-flex items-center gap-2 rounded-xl bg-rose-600/10 border border-rose-500/30 px-6 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-600/15',

  // ── Badges / Status ─────────────────────────────────────────────────────────
  badgeGreen:  'inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400',
  badgeRed:    'inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400',
  badgeAmber:  'inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400',
  badgeBlue:   'inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-400',
  badgeStone:  'inline-flex items-center gap-1 rounded-full border border-stone-700/50 bg-stone-800/60 px-2.5 py-1 text-[10px] font-semibold text-stone-400',

  // ── Grids ───────────────────────────────────────────────────────────────────
  grid2:  'grid sm:grid-cols-2 gap-4',
  grid3:  'grid sm:grid-cols-2 lg:grid-cols-3 gap-4',
  grid4:  'grid grid-cols-2 lg:grid-cols-4 gap-4',

  // ── Seção padrão ─────────────────────────────────────────────────────────────
  section:     'py-8',
  sectionInner:'mx-auto w-full max-w-[1400px]',

  // ── Ícone colorido em card ───────────────────────────────────────────────────
  iconRed:     'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10',
  iconAmber:   'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10',
  iconEmerald: 'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10',
  iconBlue:    'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10',
  iconPurple:  'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10',

  // ── Info/Alerta boxes ────────────────────────────────────────────────────────
  infoBox:    'flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3',
  warnBox:    'flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3',
  errorBox:   'flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3',
  successBox: 'flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3',

  // ── Linha divisória ──────────────────────────────────────────────────────────
  separator: 'border-t border-stone-800/50',
};

/**
 * PageHeader — header padrão de página com label + título + descrição
 * Uso: <PageHeader label="Operação" title="Perfis de cultivo" desc="Gerencie seus perfis." />
 */
export const PageHeader = ({ label, title, desc, children }) => (
  <div className="mb-8">
    {label && <p className={ds.label + ' mb-2'}>{label}</p>}
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className={ds.h2sm}>{title}</h1>
        {desc && <p className={ds.bodySm + ' mt-1 max-w-2xl'}>{desc}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  </div>
);

/**
 * SectionTitle — título de sub-seção dentro de uma página
 */
export const SectionTitle = ({ label, title, desc }) => (
  <div className="mb-6">
    {label && <p className={ds.label + ' mb-2'}>{label}</p>}
    <h2 className={ds.h2sm}>{title}</h2>
    {desc && <p className={ds.bodySm + ' mt-1'}>{desc}</p>}
  </div>
);

/**
 * StatCard — card de métrica estilo HelpPage
 */
export const StatCard = ({ icon, iconColor, value, label, desc }) => (
  <div className={ds.cardHover + ' text-center cursor-default'}>
    {icon && <i className={`fa-solid ${icon} text-xl ${iconColor || 'text-red-400'} mb-3 block`} />}
    <p className={ds.statNum}>{value}</p>
    <p className={'text-sm font-semibold text-stone-200 mt-1'}>{label}</p>
    {desc && <p className={ds.muted + ' mt-0.5'}>{desc}</p>}
  </div>
);

export default ds;
