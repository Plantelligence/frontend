/**
 * AppTopBar — Barra superior das páginas protegidas.
 * Contém: hamburguer mobile, breadcrumb, notificações, logout rápido.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { logout } from '../api/authService.js';
import api from '../api/client.js';

// ── Mapa de breadcrumb ─────────────────────────────────────────────────────────
const BREADCRUMBS = {
  '/dashboard':             [{ label: 'Painel de estufas' }],
  '/dashboard/presets':     [{ label: 'Perfis de cultivo' }],
  '/dashboard/relatorios':  [{ label: 'Relatórios' }],
  '/dashboard/onboarding':  [{ label: 'Criar nova estufa' }],
  '/dashboard/chat':        [{ label: 'Chat com IA' }],
  '/settings':              [{ label: 'Configurações' }],
  '/settings/logs':         [{ label: 'Configurações', to: '/settings' }, { label: 'Logs de segurança' }],
  '/admin/usuários':        [{ label: 'Administração' }, { label: 'Usuários e permissões' }],
  '/help':                  [{ label: 'Ajuda e documentação' }],
};

const getBreadcrumb = (pathname) => {
  // Rota de estufa específica
  if (pathname.startsWith('/dashboard/estufas/')) {
    return [{ label: 'Painel de estufas', to: '/dashboard' }, { label: 'Detalhe da estufa' }];
  }
  return BREADCRUMBS[pathname] || [{ label: 'Dashboard' }];
};

// ── Notificações (reutiliza a lógica do TopNav) ────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return diffMin + 'min';
    if (diffMin < 1440) return Math.floor(diffMin / 60) + 'h';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch { return ''; }
};

const dotColor = { critical: 'bg-rose-500', warning: 'bg-amber-500', info: 'bg-blue-400' };

const NotificationBell = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get('/notifications/', { params: { limit: 15 } });
      const items = res.data?.notifications ?? res.data?.items ?? [];
      setNotifications(items);
      setUnread(items.filter((n) => !n.read).length);
    } catch {}
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.patch('/notifications/' + id + '/read');
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnread(0);
    } catch {}
  };

  if (!userId) return null;

  return (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-200"
      >
        <i className="fa-solid fa-bell text-sm" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-surface shadow-token-lg">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-bell text-red-500 text-sm" />
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">Notificações</span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  {unread} nova{unread !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                  Marcar lidas
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" onClick={clearAll} className="text-[11px] text-rose-400 hover:text-rose-500">
                  <i className="fa-solid fa-trash-can mr-1" />Limpar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-stone-400">
                <i className="fa-solid fa-bell-slash text-xl" />
                <p className="text-xs">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button key={n.id} type="button" onClick={() => { if (!n.read) markRead(n.id); }}
                  className={'w-full border-b border-stone-100 px-4 py-3 text-left transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/50 ' + (!n.read ? 'bg-red-50/40 dark:bg-stone-900/40' : '')}>
                  <div className="flex items-start gap-2.5">
                    <span className={'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ' + (dotColor[n.severity] || 'bg-blue-400')} />
                    <div className="min-w-0 flex-1">
                      <p className={'text-xs font-semibold leading-snug ' + (n.read ? 'text-stone-400' : 'text-stone-800 dark:text-stone-100')}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-stone-500 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-stone-400">{fmtTime(n.createdAt ?? n.created_at)}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-500" />}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-stone-100 px-4 py-2.5 dark:border-stone-700">
            <p className="text-center text-[10px] text-stone-400">
              <i className="fa-solid fa-clock mr-1" />Notificações retidas por 30 dias
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── TopBar principal ───────────────────────────────────────────────────────────

export const AppTopBar = ({ onMenuOpen }) => {
  const { user, tokens, clearSession } = useAuthStore((s) => ({
    user: s.user, tokens: s.tokens, clearSession: s.clearSession,
  }));
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs   = getBreadcrumb(location.pathname);

  const handleLogout = async () => {
    try {
      // Refresh token no httpOnly cookie — backend limpa o cookie automaticamente (B3.6)
      await logout({ accessJti: tokens?.accessJti, userId: user?.id });
    } catch {}
    clearSession();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-white/95 dark:bg-[#0c0909]/95 px-4 backdrop-blur">
      {/* Hamburguer — só mobile */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 lg:hidden"
      >
        <i className="fa-solid fa-bars text-sm" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <i className="fa-solid fa-chevron-right text-[9px] text-stone-400" />}
            {crumb.to ? (
              <Link to={crumb.to} className="truncate text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition">
                {crumb.label}
              </Link>
            ) : (
              <span className={`truncate font-semibold ${i === crumbs.length - 1 ? 'text-stone-800 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Ações à direita */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <NotificationBell userId={user?.id} />

        {/* Avatar + dropdown */}
        <UserMenu user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
};

// ── UserMenu ──────────────────────────────────────────────────────────────────
const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initials = (user?.fullName || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:border-stone-600"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-[9px] font-bold text-white">
          {initials}
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate">{user?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}</span>
        <i className="fa-solid fa-chevron-down text-[9px] text-stone-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border bg-surface py-1 shadow-token-lg">
          <div className="border-b border-stone-100 px-4 py-3 dark:border-stone-700">
            <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">{user?.fullName || user?.email}</p>
            <p className="text-[10px] text-stone-500">{user?.email}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-500">{user?.organizationName}</p>
          </div>
          <div className="py-1">
            <Link to="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100">
              <i className="fa-solid fa-gear w-4 text-center" />Configurações
            </Link>
            {user?.role === 'Admin' && (
              <>
                <Link to="/admin/usuários" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100">
                  <i className="fa-solid fa-users-gear w-4 text-center" />Usuários e permissões
                </Link>
                <Link to="/settings/logs" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100">
                  <i className="fa-solid fa-shield-halved w-4 text-center" />Logs de segurança
                </Link>
              </>
            )}
          </div>
          <div className="border-t border-stone-100 py-1 dark:border-stone-700">
            <button type="button" onClick={onLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
              <i className="fa-solid fa-right-from-bracket w-4 text-center" />Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
