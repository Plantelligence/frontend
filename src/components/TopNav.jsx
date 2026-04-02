// Barra de navegacao superior com menu do usuario e links principais da aplicacao.
import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { logout } from '../api/authService.js';

export const TopNav = () => {
  const { user, tokens, clearSession } = useAuthStore((state) => ({
    user: state.user,
    tokens: state.tokens,
    clearSession: state.clearSession
  }));
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout({
        refreshToken: tokens?.refreshToken,
        accessJti: tokens?.accessJti,
        userId: user?.id
      });
    } catch (error) {
      console.warn('Erro ao encerrar sessão', error);
    } finally {
      setMenuOpen(false);
      clearSession();
      navigate('/login');
    }
  };

  const brandDestination = '/';

  const handleMenuBlur = (event) => {
    if (!menuRef.current) {
      return;
    }

    const nextTarget = event.relatedTarget;
    if (!nextTarget || !menuRef.current.contains(nextTarget)) {
      setMenuOpen(false);
    }
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-stone-700 bg-[#181415]/90 px-6 py-4 backdrop-blur">
      <Link to={brandDestination} className="flex items-center gap-2 text-lg font-semibold text-red-400">
        <img src="/logo.svg" alt="" aria-hidden="true" className="h-7 w-7" />
        <span>Plantelligence</span>
      </Link>
      <nav className="flex items-center gap-6 text-sm text-stone-300">
        {user ? (
          <>
            <div
              className="relative"
              ref={menuRef}
              onBlur={handleMenuBlur}
              onKeyDown={handleMenuKeyDown}
            >
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-md border border-stone-700 bg-[#241918] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-200 transition hover:border-red-500 hover:text-red-100"
                aria-expanded={menuOpen ? 'true' : 'false'}
                aria-haspopup="menu"
              >
                <span className="hidden md:inline">{user.email}</span>
                <span className="md:hidden">{user.email?.split('@')[0] ?? 'Conta'}</span>
                <span className="text-red-400">▾</span>
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-72 rounded-xl border border-stone-700 bg-[#181415]/95 p-2 text-sm text-stone-200 shadow-xl"
                >
                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Conta
                  </p>
                  <Link
                    to="/settings?tab=perfil"
                    className="flex items-center justify-between rounded px-3 py-2 transition hover:bg-[#241918] hover:text-red-100"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Meu perfil
                    <span className="text-xs text-slate-400">Conta</span>
                  </Link>
                  <Link
                    to="/settings?tab=config"
                    className="flex items-center justify-between rounded px-3 py-2 transition hover:bg-[#241918] hover:text-red-100"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Configurações
                    <span className="text-xs text-slate-400">Segurança e LGPD</span>
                  </Link>

                  {user.role === 'Admin' ? (
                    <>
                      <div className="my-1 border-t border-stone-700" />
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                        Administração do Sistema
                      </p>
                      <Link
                        to="/admin/usuarios"
                        className="flex items-center justify-between rounded px-3 py-2 transition hover:bg-[#241918] hover:text-red-100"
                        onClick={() => setMenuOpen(false)}
                        role="menuitem"
                      >
                        Usuários e permissões
                        <span className="text-xs text-slate-400">Admin</span>
                      </Link>
                    </>
                  ) : null}
                  {user.role === 'Admin' ? (
                    <Link
                      to="/settings/logs"
                      className="flex items-center justify-between rounded px-3 py-2 transition hover:bg-[#241918] hover:text-red-100"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Logs de segurança
                      <span className="text-xs text-slate-400">Compliance</span>
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center justify-between rounded px-3 py-2 text-left text-rose-200 transition hover:bg-rose-500/10"
                    role="menuitem"
                  >
                    Sair da conta
                    <span className="text-xs text-rose-200/70">Encerrar sessão</span>
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-red-500"
            >
              Acessar painel
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};
