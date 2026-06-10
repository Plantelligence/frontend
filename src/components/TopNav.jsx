/**
 * TopNav - Barra de navegação das páginas públicas (pré-login).
 *
 * Exibe logo, links de navegação (Tecnologia, Sobre Nós, Fale Conosco)
 * e botão de login. Versão mobile com menu hamburguer.
 * Diferente do AppTopBar.jsx que é o header do dashboard pós-login.
 */

// Barra de navegacao superior com menu do usuario, bell de notificações e links principais.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { logout } from '../api/authService.js';
import api from '../api/client.js';

// ── Bell de Notificações ───────────────────────────────────────────────────────

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
      const res = await api.get('/notifications', { params: { limit: 15 } });
      const items = res.data?.notifications ?? res.data?.items ?? [];
      setNotifications(items);
      setUnread(items.filter((n) => !n.read).length);
    } catch { }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch { }
  };

  const markRead = async (id) => {
    try {
      await api.patch('/notifications/' + id + '/read');
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch { }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnread(0);
    } catch { }
  };

  if (!userId) return null;

  return (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-stone-700 bg-[#241918] text-stone-300 transition hover:border-red-500 hover:text-red-200"
        aria-label="Notificações"
      >
        <i className="fa-solid fa-bell text-sm" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-stone-700 bg-[#1a1210] shadow-2xl border-stone-600">
          <div className="flex items-center justify-between border-b border-stone-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-bell text-red-400 text-sm" />
              <span className="text-sm font-semibold text-stone-100">Notificações</span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                  {unread} nova{unread !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] text-stone-400 transition hover:text-stone-200">
                  Marcar lidas
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" onClick={clearAll} className="text-[11px] text-rose-400/70 transition hover:text-rose-300">
                  <i className="fa-solid fa-trash-can mr-1" />Limpar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-stone-500">
                <i className="fa-solid fa-bell-slash text-2xl" />
                <p className="text-xs">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { if (!n.read) markRead(n.id); }}
                  className={'w-full border-b border-stone-800 px-4 py-3 text-left transition hover:bg-stone-800/50 ' + (!n.read ? 'bg-stone-900/40' : '')}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ' + (dotColor[n.severity] || 'bg-blue-400')} />
                    <div className="min-w-0 flex-1">
                      <p className={'text-xs font-semibold leading-snug ' + (n.read ? 'text-stone-400' : 'text-stone-100')}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-stone-500 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-stone-600 dark:text-stone-400">{fmtTime(n.createdAt ?? n.created_at)}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-500" />}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-stone-700 px-4 py-2.5">
            <p className="text-center text-[10px] text-stone-600 dark:text-stone-400 mb-1.5">
              <i className="fa-solid fa-clock mr-1" />Notificações retidas por 30 dias
            </p>
            <Link to="/settings/logs" onClick={() => setOpen(false)} className="block text-center text-[11px] text-stone-400 transition hover:text-red-300">
              Ver logs de segurança
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// ── TopNav principal ──────────────────────────────────────────────────────────

export const TopNav = () => {
  const { user, tokens, clearSession } = useAuthStore((state) => ({
    user: state.user,
    tokens: state.tokens,
    clearSession: state.clearSession
  }));
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAuthPage = ['/login', '/register', '/password-reset', '/first-access'].some(
    (p) => location.pathname.startsWith(p)
  );

  const handleLogout = async () => {
    try {
      // Refresh token no httpOnly cookie — backend limpa o cookie automaticamente (B3.6)
      await logout({ accessJti: tokens?.accessJti, userId: user?.id });
    } catch (error) {
      console.warn('Erro ao encerrar sessão', error);
    } finally {
      setMenuOpen(false);
      clearSession();
      navigate('/login');
    }
  };

  const handleMenuBlur = (event) => {
    if (!menuRef.current) return;
    const nextTarget = event.relatedTarget;
    if (!nextTarget || !menuRef.current.contains(nextTarget)) setMenuOpen(false);
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-stone-700/50 bg-[#181415]/95 px-5 backdrop-blur">
      <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-red-400">
        <img src="/logo.svg" alt="" aria-hidden="true" className="h-5 w-5" />
        <span className="text-sm font-bold tracking-widest">PLANTELLIGENCE</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm text-stone-300 md:gap-4">
        <Link to="/sobre-nos" className="hidden rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-stone-400 transition hover:text-red-300 md:inline-flex">
          SOBRE NÓS
        </Link>
        {user ? (
          <>
            <NotificationBell userId={user?.id} />
            <div className="relative" ref={menuRef} onBlur={handleMenuBlur} onKeyDown={handleMenuKeyDown}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-stone-700/60 bg-[#241918]/60 px-3 py-1.5 text-xs font-medium text-stone-300 transition hover:border-red-500/60 hover:text-red-200"
                aria-expanded={menuOpen ? 'true' : 'false'}
                aria-haspopup="menu"
              >
                <span className="hidden md:inline">{user.fullName?.split(' ')[0] || user.email?.split('@')[0] || 'Conta'}</span>
                <span className="md:hidden">{user.fullName?.split(' ')[0] || user.email?.split('@')[0] || 'Conta'}</span>
                <span className="text-red-400">&#9660;</span>
              </button>
              {menuOpen ? (
                <div role="menu" className="absolute right-0 mt-3 w-56 rounded-xl border border-stone-700 bg-[#181415]/95 p-2 text-sm text-stone-200 shadow-xl">
                  <div className="border-b border-stone-700 px-3 py-3">
                    <p className="text-xs font-semibold text-stone-100">{user.fullName ?? user.email}</p>
                    <p className="text-[10px] text-stone-400">{user.email}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-400">{user.organizationName || 'Sem organização'}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/dashboard" className="flex items-center gap-2 rounded px-3 py-2 text-xs transition hover:bg-[#241918] hover:text-red-100" onClick={() => setMenuOpen(false)} role="menuitem">
                      <i className="fa-solid fa-house w-4 text-center" />Espaço da organização
                    </Link>
                    <Link to="/settings" className="flex items-center gap-2 rounded px-3 py-2 text-xs transition hover:bg-[#241918] hover:text-red-100" onClick={() => setMenuOpen(false)} role="menuitem">
                      <i className="fa-solid fa-gear w-4 text-center" />Configurações
                    </Link>
                    {user.role === 'Admin' && (
                      <>
                        <Link to="/admin/usuários" className="flex items-center gap-2 rounded px-3 py-2 text-xs transition hover:bg-[#241918] hover:text-red-100" onClick={() => setMenuOpen(false)} role="menuitem">
                          <i className="fa-solid fa-users-gear w-4 text-center" />Usuários e permissões
                        </Link>
                        <Link to="/settings/logs" className="flex items-center gap-2 rounded px-3 py-2 text-xs transition hover:bg-[#241918] hover:text-red-100" onClick={() => setMenuOpen(false)} role="menuitem">
                          <i className="fa-solid fa-shield-halved w-4 text-center" />Logs de segurança
                        </Link>
                      </>
                    )}
                  </div>
                  <div className="border-t border-stone-700 pt-1">
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-500/10" role="menuitem">
                      <i className="fa-solid fa-right-from-bracket w-4 text-center" />Sair da conta
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : !isAuthPage ? (
          <Link to="/login" className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-red-500">
            Acessar painel
          </Link>
        ) : null}
      </nav>
    </header>
  );
};
