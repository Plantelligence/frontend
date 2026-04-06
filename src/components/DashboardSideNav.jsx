// Menu lateral do dashboard com os links principais.
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export const DashboardSideNav = ({ active = 'dashboard', footerText }) => {
  const user = useAuthStore((state) => state.user);
  const organizationName = user?.organizationName || 'Organizacao';

  const itemClass =
    'block rounded-xl px-3 py-2 text-stone-200 transition hover:bg-red-700/25 hover:text-red-100';

  const activeClass = 'rounded-xl bg-red-600 px-3 py-2 font-semibold text-red-50';

  const items = {
    dashboard: { label: 'Painel de estufas', to: '/dashboard' },
    onboarding: { label: 'Criar nova estufa', to: '/dashboard/onboarding' },
    presets: { label: 'Perfis de cultivo', to: '/dashboard/presets' },
    chat: { label: 'Chat com IA', to: '/dashboard/chat' }
  };

  const renderNavItem = (key) => {
    const item = items[key];
    if (!item) {
      return null;
    }

    if (active === key) {
      return <div className={activeClass}>{item.label}</div>;
    }

    return (
      <Link to={item.to} className={itemClass}>
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="flex h-full flex-col rounded-[26px] border border-stone-800 bg-gradient-to-b from-[#2a1b1a] to-[#1c1312] p-5 text-stone-100">
      <div className="mb-6 border-b border-red-900/50 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-300">Organização</p>
        <h2 className="mt-2 text-2xl font-semibold">Espaço da {organizationName}</h2>
        <p className="mt-1 text-xs text-red-200">Aqui ficam as estufas da sua empresa.</p>
      </div>

      <nav className="flex-1 space-y-5 text-sm">
        <div className="space-y-2">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Operação</p>
          {renderNavItem('dashboard')}
          {renderNavItem('presets')}
          {user?.role !== 'Reader' ? renderNavItem('onboarding') : null}
        </div>

        <div className="space-y-2">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Apoio</p>
          {renderNavItem('chat')}
        </div>

      </nav>

      {footerText ? (
        <div className="mt-8 rounded-2xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-100">
          {footerText}
        </div>
      ) : null}
    </aside>
  );
};