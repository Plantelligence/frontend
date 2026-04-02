// Menu lateral do dashboard — exibe os links de navegação principais e um rodapé configurável.
import React from 'react';
import { Link } from 'react-router-dom';

export const DashboardSideNav = ({ active = 'dashboard', footerText }) => {
  const itemClass =
    'block rounded-xl px-3 py-2 text-stone-200 transition hover:bg-red-700/25 hover:text-red-100';

  const activeClass = 'rounded-xl bg-red-600 px-3 py-2 font-semibold text-red-50';

  return (
    <aside className="flex h-full flex-col rounded-[26px] border border-stone-800 bg-gradient-to-b from-[#2a1b1a] to-[#1c1312] p-5 text-stone-100">
      <div className="mb-6 border-b border-red-900/50 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-300">Plantelligence</p>
        <h2 className="mt-2 text-2xl font-semibold">Minhas estufas</h2>
      </div>

      <nav className="flex-1 space-y-2 text-sm">
        {active === 'dashboard' ? (
          <div className={activeClass}>Painel de estufas</div>
        ) : (
          <Link to="/dashboard" className={itemClass}>
            Painel de estufas
          </Link>
        )}

        {active === 'settings' ? (
          <div className={activeClass}>Configurações da conta</div>
        ) : (
          <Link to="/settings" className={itemClass}>
            Configurações da conta
          </Link>
        )}

        {active === 'onboarding' ? (
          <div className={activeClass}>Criar nova estufa</div>
        ) : (
          <Link to="/dashboard/onboarding" className={itemClass}>
            Criar nova estufa
          </Link>
        )}

        {active === 'chat' ? (
          <div className={activeClass}>Chat com IA</div>
        ) : (
          <Link to="/dashboard/chat" className={itemClass}>
            Chat com IA
          </Link>
        )}
      </nav>

      {footerText ? (
        <div className="mt-8 rounded-2xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-100">
          {footerText}
        </div>
      ) : null}
    </aside>
  );
};