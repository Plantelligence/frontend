/**
 * DashboardLayout — Shell para todas as rotas protegidas.
 * Sidebar colapsável + TopBar + área de conteúdo.
 * Substitui o padrão antigo de cada página ter seu próprio wrapper + DashboardSideNav.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar.jsx';
import { AppTopBar } from './AppTopBar.jsx';

export const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-token text-[var(--color-text-primary)] overflow-hidden" style={{ height: "100dvh" }}>
      {/* Sidebar */}
      <AppSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Conteúdo principal — margem esquerda = largura do rail colapsado (56px) */}
      <div className="flex flex-1 flex-col min-w-0 lg:ml-14">
        {/* TopBar sticky */}
        <AppTopBar onMenuOpen={() => setMobileMenuOpen(true)} />

        {/* Scroll area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
