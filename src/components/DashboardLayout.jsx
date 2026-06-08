/**
 * DashboardLayout — Shell para todas as rotas protegidas.
 * Sidebar colapsável + TopBar + área de conteúdo.
 * Quando a sidebar está fixada (pinned), o conteúdo se expande para ml-56.
 */

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar.jsx';
import { AppTopBar } from './AppTopBar.jsx';

export const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    try { return localStorage.getItem('sidebar-pinned') === 'true'; } catch { return false; }
  });

  // Sincroniza quando o usuário altera o pin via sidebar
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'sidebar-pinned') {
        setSidebarPinned(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);

    // Polling local (mesmo tab) a cada 200ms
    const id = setInterval(() => {
      try {
        const v = localStorage.getItem('sidebar-pinned') === 'true';
        setSidebarPinned((prev) => prev !== v ? v : prev);
      } catch {}
    }, 200);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex h-screen bg-token text-[var(--color-text-primary)] overflow-hidden" style={{ height: "100dvh" }}>
      <AppSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Margem: 56px (rail colapsado) ou 224px (sidebar fixada) */}
      <div className={`flex flex-1 flex-col min-w-0 transition-all duration-200 ${sidebarPinned ? 'lg:ml-56' : 'lg:ml-14'}`}>
        <AppTopBar onMenuOpen={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
