/**
 * DashboardLayout — Shell para todas as rotas protegidas.
 * Sidebar colapsável + TopBar + área de conteúdo.
 * Quando a sidebar está fixada (pinned), o conteúdo se expande para ml-56.
 */

// useState: controla estado local do menu mobile e do pin da sidebar
// useEffect: sincroniza o estado de pin com o localStorage em tempo real
import React, { useState, useEffect } from 'react';
// Outlet: renderiza a página filha correspondente à rota ativa
import { Outlet } from 'react-router-dom';
// AppSidebar: sidebar colapsável com navegação e controles de tema
import { AppSidebar } from './AppSidebar.jsx';
// AppTopBar: barra superior com breadcrumb, notificações e menu do usuário
import { AppTopBar } from './AppTopBar.jsx';

export const DashboardLayout = () => {
  // Controla a abertura/fechamento do drawer de navegação no mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Lê o estado de pin da sidebar do localStorage para preservar entre recargas
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    try { return localStorage.getItem('sidebar-pinned') === 'true'; } catch { return false; }
  });

  // Sincroniza quando o usuário altera o pin via sidebar
  useEffect(() => {
    // Listener para mudanças em outras abas do mesmo navegador
    const onStorage = (e) => {
      if (e.key === 'sidebar-pinned') {
        setSidebarPinned(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);

    // Polling local (mesmo tab) a cada 200ms
    // Necessário porque o evento 'storage' não dispara na mesma aba que originou a mudança
    const id = setInterval(() => {
      try {
        const v = localStorage.getItem('sidebar-pinned') === 'true';
        // Atualiza apenas se o valor mudou para evitar re-renders desnecessários
        setSidebarPinned((prev) => prev !== v ? v : prev);
      } catch {}
    }, 200);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, []);

  return (
    // Ocupa toda a tela com 100dvh (dynamic viewport height) para evitar problemas no mobile
    <div className="flex h-screen bg-token text-[var(--color-text-primary)] overflow-hidden" style={{ height: "100dvh" }}>
      {/* Sidebar: recebe o estado do menu mobile para controlar o drawer */}
      <AppSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Margem: 56px (rail colapsado) ou 224px (sidebar fixada) */}
      {/* transition-all garante que a mudança de margem seja animada suavemente */}
      <div className={`flex flex-1 flex-col min-w-0 transition-all duration-200 ${sidebarPinned ? 'lg:ml-56' : 'lg:ml-14'}`}>
        {/* TopBar sticky no topo da área de conteúdo */}
        <AppTopBar onMenuOpen={() => setMobileMenuOpen(true)} />

        {/* Área de conteúdo principal com scroll independente do sidebar */}
        <main className="flex-1 overflow-y-auto">
          {/* Limita a largura máxima do conteúdo e aplica padding responsivo */}
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6">
            {/* Outlet renderiza a página atual conforme a rota ativa */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
