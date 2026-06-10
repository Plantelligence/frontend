/**
 * Design System — Plantelligence
 * Tokens compartilhados para consistência visual entre todas as telas pós-login.
 * Referência visual: HelpPage (tela de Ajuda e Documentação).
 *
 * USO: import { ds } from '../utils/designSystem.js';
 *      <div className={ds.card}>...</div>
 */

// Objeto com todos os tokens visuais do sistema como strings de classes Tailwind
// Centralizar aqui evita duplicação e facilita ajustes globais de design
export const ds = {
  // ── Fundos de seção ─────────────────────────────────────────────────────────
  // Fundo primário igual à landing page, para consistência entre áreas logadas e públicas
  pageBg:      'bg-[#0c0909]',          // fundo primário (igual landing page)
  // Fundo levemente diferente para separar seções visualmente sem usar bordas
  sectionAlt:  'bg-[#0f0c0c]',          // fundo alternado entre seções
  // Linha divisória sutil entre seções
  divider:     'border-t border-stone-800/40',

  // ── Cards ───────────────────────────────────────────────────────────────────
  // Card padrão: borda sutil, fundo escuro semi-transparente e padding generoso
  card:        'rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6',
  // Card com efeito hover de elevação — ideal para cards clicáveis
  cardHover:   'rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6 transition-all hover:border-stone-700/80 hover:-translate-y-[2px]',
  // Card menor para informações secundárias ou painéis laterais
  cardSm:      'rounded-xl border border-stone-800/60 bg-stone-900/35 p-4',
  // Card selecionado com destaque em vermelho — usado em listas de seleção
  cardSelected:'rounded-2xl border border-red-500/50 bg-red-600/10 p-6 ring-1 ring-red-500/30',
  // Card interno dentro de outro card — hierarquia visual de informações
  cardNested:  'rounded-xl border border-stone-700/40 bg-stone-800/40 p-4',

  // ── Tipografia ──────────────────────────────────────────────────────────────
  // Rótulo de seção: pequeno, maiúsculo e em vermelho — chama atenção sem dominar
  label:     'text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500',  // rótulo de seção
  // Título principal de página — grande, negrito e compacto
  h1:        'text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-white',
  // Título de seção principal dentro de uma página
  h2:        'text-3xl sm:text-4xl font-bold text-white leading-tight',
  // Título menor de seção — mais discreto que h2
  h2sm:      'text-2xl font-bold text-white leading-tight',
  // Título de card ou grupo de informações
  h3:        'text-base font-semibold text-stone-100',
  // Subtítulo menor dentro de cards ou listas
  h3sm:      'text-sm font-semibold text-stone-100',
  // Texto descritivo principal — cor suave para não competir com títulos
  body:      'text-stone-400 leading-relaxed',
  // Texto descritivo menor — para informações secundárias
  bodySm:    'text-sm text-stone-400 leading-relaxed',
  // Texto de apoio: datas, metadados, labels de campo
  muted:     'text-xs text-stone-500',
  // Número destacado em cards de métricas (ex.: "42 estufas")
  statNum:   'text-3xl font-bold text-white',

  // ── Inputs ──────────────────────────────────────────────────────────────────
  // Input padrão com foco em vermelho — segue a identidade do sistema
  input:     'rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20',
  // Input menor para formulários compactos ou filtros inline
  inputSm:   'rounded-lg border border-stone-700/50 bg-stone-800/50 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/50',
  // Select/dropdown com o mesmo estilo dos inputs
  select:    'rounded-xl border border-stone-700/60 bg-stone-800/60 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-red-500/60',
  // Textarea com resize desativado para manter o layout consistente
  textarea:  'w-full resize-none rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20',

  // ── Botões ──────────────────────────────────────────────────────────────────
  // Botão principal — vermelho sólido, para ações primárias da tela
  btnPrimary:   'inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
  // Botão secundário — borda discreta, para ações secundárias
  btnSecondary: 'inline-flex items-center gap-2 rounded-xl border border-stone-700/60 px-6 py-3 text-sm font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white',
  // Botão fantasma — sem borda, aparece apenas no hover — para ações contextuais
  btnGhost:     'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-stone-400 transition hover:bg-stone-800/60 hover:text-stone-200',
  // Botão de perigo — fundo rosado sutil para ações destrutivas ou irreversíveis
  btnDanger:    'inline-flex items-center gap-2 rounded-xl bg-rose-600/10 border border-rose-500/30 px-6 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-600/15',

  // ── Badges / Status ─────────────────────────────────────────────────────────
  // Badges coloridos para indicar estados: verde=ok, vermelho=alerta, âmbar=aviso, azul=info
  badgeGreen:  'inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400',
  badgeRed:    'inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400',
  badgeAmber:  'inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400',
  badgeBlue:   'inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-400',
  // Badge neutro para estados sem classificação de criticidade
  badgeStone:  'inline-flex items-center gap-1 rounded-full border border-stone-700/50 bg-stone-800/60 px-2.5 py-1 text-[10px] font-semibold text-stone-400',

  // ── Grids ───────────────────────────────────────────────────────────────────
  // Grid responsivo de 2 colunas para cards lado a lado em telas médias
  grid2:  'grid sm:grid-cols-2 gap-4',
  // Grid de até 3 colunas para listagens mais densas
  grid3:  'grid sm:grid-cols-2 lg:grid-cols-3 gap-4',
  // Grid de até 4 colunas para métricas em linha (estatísticas do dashboard)
  grid4:  'grid grid-cols-2 lg:grid-cols-4 gap-4',

  // ── Seção padrão ─────────────────────────────────────────────────────────────
  // Padding vertical padrão entre seções de uma página
  section:     'py-8',
  // Largura máxima e centralização horizontal do conteúdo das seções
  sectionInner:'mx-auto w-full max-w-[1400px]',

  // ── Ícone colorido em card ───────────────────────────────────────────────────
  // Wrappers quadrados para ícones FontAwesome com fundo colorido semitransparente
  iconRed:     'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10',
  iconAmber:   'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10',
  iconEmerald: 'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10',
  iconBlue:    'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10',
  iconPurple:  'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10',

  // ── Info/Alerta boxes ────────────────────────────────────────────────────────
  // Caixas de mensagem coloridas: azul=informação, âmbar=aviso, vermelho=erro, verde=sucesso
  infoBox:    'flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3',
  warnBox:    'flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3',
  errorBox:   'flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3',
  successBox: 'flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3',

  // ── Linha divisória ──────────────────────────────────────────────────────────
  // Linha horizontal sutil para separar grupos de conteúdo dentro de cards
  separator: 'border-t border-stone-800/50',
};

/**
 * PageHeader — header padrão de página com label + título + descrição
 * Uso: <PageHeader label="Operação" title="Perfis de cultivo" desc="Gerencie seus perfis." />
 */
export const PageHeader = ({ label, title, desc, children }) => (
  <div className="mb-8">
    {/* Rótulo de categoria acima do título, em vermelho e maiúsculo */}
    {label && <p className={ds.label + ' mb-2'}>{label}</p>}
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {/* Título principal da página */}
        <h1 className={ds.h2sm}>{title}</h1>
        {/* Descrição opcional abaixo do título */}
        {desc && <p className={ds.bodySm + ' mt-1 max-w-2xl'}>{desc}</p>}
      </div>
      {/* Slot para botões ou ações no canto direito do header */}
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  </div>
);

/**
 * SectionTitle — título de sub-seção dentro de uma página
 */
export const SectionTitle = ({ label, title, desc }) => (
  <div className="mb-6">
    {/* Rótulo opcional de categoria da sub-seção */}
    {label && <p className={ds.label + ' mb-2'}>{label}</p>}
    {/* Título da sub-seção */}
    <h2 className={ds.h2sm}>{title}</h2>
    {/* Descrição opcional da sub-seção */}
    {desc && <p className={ds.bodySm + ' mt-1'}>{desc}</p>}
  </div>
);

/**
 * StatCard — card de métrica estilo HelpPage
 */
export const StatCard = ({ icon, iconColor, value, label, desc }) => (
  <div className={ds.cardHover + ' text-center cursor-default'}>
    {/* Ícone FontAwesome centralizado com cor configurável */}
    {icon && <i className={`fa-solid ${icon} text-xl ${iconColor || 'text-red-400'} mb-3 block`} />}
    {/* Valor numérico em destaque */}
    <p className={ds.statNum}>{value}</p>
    {/* Label descritivo abaixo do número */}
    <p className={'text-sm font-semibold text-stone-200 mt-1'}>{label}</p>
    {/* Descrição adicional opcional em texto menor */}
    {desc && <p className={ds.muted + ' mt-0.5'}>{desc}</p>}
  </div>
);

export default ds;
