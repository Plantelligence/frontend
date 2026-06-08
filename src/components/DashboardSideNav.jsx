// Menu lateral do dashboard — desktop: aside fixo | mobile: drawer deslizante com hamburger.
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/authStore.js';

const ITEMS = {
  dashboard:  { label: 'Painel de estufas', to: '/dashboard' },
  presets:    { label: 'Perfis de cultivo', to: '/dashboard/presets' },
  relatorios: { label: 'Relatórios',        to: '/dashboard/relatorios' },
  onboarding: { label: 'Criar nova estufa', to: '/dashboard/onboarding' },
  chat:       { label: 'Chat com IA',       to: '/dashboard/chat' },
};

// ── Conteúdo interno do nav (reutilizado no desktop e no drawer) ──────────────

function NavContent({ active, footerText, onClose }) {
  const user     = useAuthStore((s) => s.user);
  const orgName  = user?.organizationName || 'Organização';
  const isReader = user?.role === 'Reader';

  const base    = 'flex items-center rounded-xl px-3 py-2.5 text-sm text-stone-700 dark:text-stone-200 transition hover:bg-red-50 dark:hover:bg-red-700/25 hover:text-red-700 dark:hover:text-red-100';
  const activeC = 'flex items-center rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-red-50';

  const renderItem = (key) => {
    const item = ITEMS[key];
    if (!item) return null;
    if (active === key) return <div key={key} className={activeC}>{item.label}</div>;
    return (
      <Link key={key} to={item.to} className={base} onClick={onClose}>
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col p-5 text-stone-800 dark:text-stone-100">
      {/* Cabeçalho org */}
      <div className="mb-6 border-b border-stone-200 dark:border-red-900/50 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-300">Organização</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug">Espaço da {orgName}</h2>
        <p className="mt-1 text-xs text-red-600 dark:text-red-200">Aqui ficam as estufas da sua empresa.</p>
      </div>

      {/* Itens de nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">Operação</p>
          {renderItem('dashboard')}
          {renderItem('presets')}
          {renderItem('relatorios')}
          {!isReader && renderItem('onboarding')}
        </div>
        <div className="space-y-1">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">Apoio</p>
          {renderItem('chat')}
        </div>
      </nav>

      {/* Rodapé info */}
      {footerText && (
        <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-100">
          {footerText}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export const DashboardSideNav = ({ active = 'dashboard', footerText }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Trava scroll do body e fecha com Escape quando drawer aberto
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // ── Barra mobile superior ──────────────────────────────────────────────────
  const MobileBar = (
    <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-gradient-to-r dark:from-[#2a1b1a] dark:to-[#1c1312] px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Abrir menu"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#241918] text-stone-600 dark:text-stone-300 transition hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-200"
      >
        <i className="fa-solid fa-bars text-sm" />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
          {ITEMS[active]?.label ?? 'Menu'}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">Plantelligence</p>
      </div>
    </div>
  );

  // ── Drawer portal (mobile/tablet) ──────────────────────────────────────────
  const Drawer = drawerOpen ? createPortal(
    <div className="fixed inset-0 z-[9998] lg:hidden">
      {/* Overlay escuro */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setDrawerOpen(false)}
      />
      {/* Painel deslizante */}
      <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto rounded-r-3xl border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-gradient-to-b dark:from-[#2a1b1a] dark:to-[#1c1312] shadow-2xl">
        {/* Botão fechar */}
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Fechar menu"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#241918] text-stone-500 dark:text-stone-400 transition hover:text-red-600 dark:hover:text-red-300"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>
        <NavContent
          active={active}
          footerText={footerText}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>
    </div>,
    document.body
  ) : null;

  // ── Sidebar desktop ────────────────────────────────────────────────────────
  const DesktopSide = (
    <aside className="hidden h-full flex-col rounded-[26px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-gradient-to-b dark:from-[#2a1b1a] dark:to-[#1c1312] lg:flex">
      <NavContent active={active} footerText={footerText} onClose={() => {}} />
    </aside>
  );

  return (
    <>
      {MobileBar}
      {Drawer}
      {DesktopSide}
    </>
  );
};
