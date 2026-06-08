/**
 * AppSidebar - Sidebar colapsavel estilo Mailtrap/LegalManager.
 *
 * Desktop:
 *   Colapsado: rail de 56px com icones
 *   Expandido: 220px com icones + labels + grupos, abre ao hover
 * Mobile:
 *   Drawer deslizante pelo esquerdo (portal)
 *   Botao hamburger na TopBar
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/authStore.js';
import { useTheme } from '../store/themeStore.js';
import { FeedbackModal } from './FeedbackModal.jsx';

// Nav items (apenas operacional - conta fica no dropdown da topbar)
const NAV = [
  {
    group: null,
    items: [
      { key: 'dashboard', icon: 'fa-house', label: 'Painel de estufas', to: '/dashboard' },
    ],
  },
  {
    group: 'Operacao',
    groupLabel: 'Operação',
    items: [
      { key: 'presets',    icon: 'fa-leaf',        label: 'Perfis de cultivo', to: '/dashboard/presets' },
      { key: 'relatorios', icon: 'fa-chart-bar',   label: 'Relatorios',        to: '/dashboard/relatorios' },
      { key: 'onboarding', icon: 'fa-circle-plus', label: 'Criar nova estufa', to: '/dashboard/onboarding', hideForReader: true },
    ],
  },
  {
    group: 'Apoio',
    groupLabel: 'Apoio',
    items: [
      { key: 'chat', icon: 'fa-robot', label: 'Chat com IA', to: '/dashboard/chat' },
    ],
  },
];

// Detecta item ativo pela rota
const getActiveKey = (pathname) => {
  if (pathname.startsWith('/dashboard/presets'))    return 'presets';
  if (pathname.startsWith('/dashboard/relatorios')) return 'relatorios';
  if (pathname.startsWith('/dashboard/onboarding')) return 'onboarding';
  if (pathname.startsWith('/dashboard/chat'))       return 'chat';
  if (pathname.startsWith('/dashboard/estufas'))    return 'dashboard';
  if (pathname.startsWith('/dashboard'))            return 'dashboard';
  if (pathname.startsWith('/admin'))                return 'admin';
  if (pathname.startsWith('/settings/logs'))        return 'logs';
  if (pathname.startsWith('/settings'))             return 'settings';
  if (pathname.startsWith('/help'))                 return 'help';
  return '';
};

// Logo SVG
const LogoIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }} aria-hidden="true">
    <ellipse cx="12" cy="10" rx="8" ry="6" fill="#ef4444" opacity="0.9" />
    <ellipse cx="12" cy="11" rx="7" ry="2" fill="#1a0000" opacity="0.5" />
    <rect x="9.5" y="13" width="5" height="7" rx="2" fill="#b91c1c" opacity="0.7" />
    <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.4" />
    <circle cx="14" cy="7" r="1" fill="white" opacity="0.3" />
  </svg>
);

// Item de navegacao
const NavItem = ({ item, active, expanded, onClick }) => {
  const isActive = active === item.key;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      title={!expanded ? item.label : undefined}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
        ${isActive
          ? 'bg-red-600/10 text-red-600 dark:bg-red-600/15 dark:text-red-400'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800/70 dark:hover:text-stone-200'
        }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-red-500" />
      )}
      <i className={`fa-solid ${item.icon} w-4 text-center text-[15px] flex-shrink-0 ${isActive ? 'text-red-500' : ''}`} />
      {expanded && <span className="truncate">{item.label}</span>}
    </Link>
  );
};

// Botao de acao do rodape (feedback, ajuda, tema)
const FooterBtn = ({ icon, label, expanded, onClick, linkTo, active }) => {
  const cls = `relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150
    ${active
      ? 'bg-red-600/10 text-red-600 dark:bg-red-600/15 dark:text-red-400'
      : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800/70 dark:hover:text-stone-200'
    }`;

  if (linkTo) {
    return (
      <Link to={linkTo} title={!expanded ? label : undefined} className={cls} onClick={onClick}>
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-red-500" />}
        <i className={`fa-solid ${icon} w-4 text-center text-[15px] flex-shrink-0`} />
        {expanded && <span className="truncate">{label}</span>}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} title={!expanded ? label : undefined} className={cls}>
      <i className={`fa-solid ${icon} w-4 text-center text-[15px] flex-shrink-0`} />
      {expanded && <span className="truncate">{label}</span>}
    </button>
  );
};

// Conteudo interno do sidebar
const SidebarContent = ({ expanded, activeKey, onNavigate, onPin, pinned }) => {
  const user     = useAuthStore((s) => s.user);
  const isReader = user?.role === 'Reader';
  const orgName  = user?.organizationName || 'Organizacao';
  const { theme, toggleTheme } = useTheme();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className={`flex flex-shrink-0 items-center border-b border-stone-200 dark:border-stone-700/60 transition-all duration-200 ${expanded ? 'gap-3 px-4 py-4' : 'justify-center px-0 py-4'}`}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-950/80 border border-red-800/40">
          <LogoIcon size={20} />
        </div>
        {expanded && (
          <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest text-red-500 whitespace-nowrap">PLANTELLIGENCE</p>
              <p className="truncate text-[10px] text-stone-500 dark:text-stone-400">{orgName}</p>
            </div>
            {onPin && (
              <button
                type="button"
                onClick={onPin}
                title={pinned ? 'Desafixar menu' : 'Fixar menu aberto'}
                className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  pinned
                    ? 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                    : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                <i className={`fa-solid fa-thumbtack text-[11px] ${pinned ? '' : 'opacity-60'}`} style={pinned ? {} : { transform: 'rotate(45deg)' }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navegacao principal */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV.map((section, si) => {
          const visibleItems = section.items.filter((item) => {
            if (item.hideForReader && isReader) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={si} className={si > 0 ? 'mt-4' : ''}>
              {expanded && section.groupLabel && (
                <p className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                  {section.groupLabel}
                </p>
              )}
              {!expanded && section.group && si > 0 && (
                <div className="my-2 mx-auto h-px w-6 bg-stone-200 dark:bg-stone-700/50" />
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavItem key={item.key} item={item} active={activeKey} expanded={expanded} onClick={onNavigate} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Rodape: ajuda, feedback, tema */}
      <div className="flex-shrink-0 border-t border-stone-200 dark:border-stone-700/60 px-2 py-3 space-y-0.5">
        {!expanded && <div className="my-1 mx-auto h-px w-6 bg-stone-200 dark:bg-stone-700/50" />}

        {/* Ajuda */}
        <FooterBtn
          icon="fa-circle-question"
          label="Ajuda e documentação"
          expanded={expanded}
          linkTo="/help"
          onClick={onNavigate}
          active={activeKey === 'help'}
        />

        {/* Feedback */}
        <FooterBtn
          icon="fa-paper-plane"
          label="Enviar feedback"
          expanded={expanded}
          onClick={() => setFeedbackOpen(true)}
        />

        {/* Tema */}
        <FooterBtn
          icon={theme === 'dark' ? 'fa-sun' : 'fa-moon'}
          label={theme === 'dark' ? 'Modo escuro' : 'Modo claro'}
          expanded={expanded}
          onClick={toggleTheme}
        />
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
};

// Componente principal
export const AppSidebar = ({ mobileOpen, onMobileClose }) => {
  const location  = useLocation();
  const activeKey = getActiveKey(location.pathname);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(() => {
    try { return localStorage.getItem('sidebar-pinned') === 'true'; } catch { return false; }
  });

  const expanded = hovered || pinned;

  const togglePin = () => {
    setPinned(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-pinned', String(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onMobileClose?.(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [mobileOpen, onMobileClose]);

  // Desktop sidebar
  const DesktopSidebar = (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col
        bg-surface dark:bg-[#161210]
        border-r border-stone-200 dark:border-stone-800/60
        shadow-sm transition-all duration-200 ease-in-out
        ${expanded ? 'w-56' : 'w-14'}
      `}
    >
      <SidebarContent expanded={expanded} activeKey={activeKey} onNavigate={() => {}} onPin={togglePin} pinned={pinned} />
    </aside>
  );

  // Mobile drawer
  const MobileDrawer = mobileOpen ? createPortal(
    <div className="fixed inset-0 z-[9998] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
      <aside className="absolute inset-y-0 left-0 w-64 flex flex-col bg-surface dark:bg-[#161210] border-r border-border shadow-2xl">
        <button
          type="button"
          onClick={onMobileClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <SidebarContent expanded={true} activeKey={activeKey} onNavigate={onMobileClose} />
      </aside>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {DesktopSidebar}
      {MobileDrawer}
    </>
  );
};

export { getActiveKey };
