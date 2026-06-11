/**
 * App.jsx - Componente raiz da aplicação Plantelligence.
 *
 * Define todas as rotas do sistema usando React Router v6.
 * Estrutura de rotas:
 *   - Públicas (Shell + TopNav + Footer): landing, sobre, contato, políticas
 *   - Protegidas (DashboardLayout): dashboard, estufas, chat, relatórios
 *   - Autenticação (AuthShell): login, registro, reset de senha
 *
 * Recursos implementados aqui:
 *   - GuestRoute: redireciona usuários já logados para fora das páginas de auth
 *   - ErrorBoundary: captura erros de renderização e exibe tela amigável
 *   - Cookie consent banner: aparece 1,6s após o carregamento
 *   - Lock screen: overlay de bloqueio por inatividade (useIdleTimer)
 *   - Redirecionamento de first-access token via query string
 */

// Componente raiz da aplicacao, define as rotas e a estrutura principal do app.
// Component: necessário para a classe ErrorBoundary (não existe hook equivalente)
import React, { useEffect, useRef, useState, Component } from 'react';
// createPortal: renderiza o banner de cookies fora da hierarquia normal do DOM
import { createPortal } from 'react-dom';
// Hooks e componentes do React Router para navegação e definição de rotas
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
// Importações de todas as páginas — carregadas de forma síncrona (sem lazy loading por ora)
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { PasswordResetPage } from './pages/PasswordResetPage.jsx';
import { FirstAccessPage } from './pages/FirstAccessPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { GreenhousesPage } from './pages/GreenhousesPage.jsx';
import { OnboardingGreenhousePage } from './pages/OnboardingGreenhousePage.jsx';
import { UserSettingsPage } from './pages/UserSettingsPage.jsx';
import { SecurityLogsPage } from './pages/SecurityLogsPage.jsx';
import { AdminUsersPage } from './pages/AdminUsersPage.jsx';
import { ChatAIPage } from './pages/ChatAIPage.jsx';
import { PresetsPage } from './pages/PresetsPage.jsx';
import { RelatoriosPage } from './pages/RelatoriosPage.jsx';
import { HelpPage } from './pages/HelpPage.jsx';
import { TechnologyPage } from './pages/TechnologyPage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { ContactPage } from './pages/ContactPage.jsx';
import { TermsPage } from './pages/TermsPage.jsx';
import { PrivacyPage } from './pages/PrivacyPage.jsx';
import { CookiesPage } from './pages/CookiesPage.jsx';
import { EulaPage } from './pages/EulaPage.jsx';
import { SegurancaPage } from './pages/SegurancaPage.jsx';
// Componentes de layout e navegação
import { TopNav } from './components/TopNav.jsx';
import { DashboardLayout } from './components/DashboardLayout.jsx';
import { ScrollToTop } from './components/ScrollToTop.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AdminRoute } from './components/AdminRoute.jsx';
// Store de autenticação global
import { useAuthStore } from './store/authStore.js';
// Hook de detecção de inatividade para o lock screen
import { useIdleTimer } from './hooks/useIdleTimer.js';
// Overlay de bloqueio por inatividade
import { LockScreen } from './components/LockScreen.jsx';

// Chave usada para persistir a escolha de consentimento de cookies do usuário
const COOKIE_STORAGE_KEY = 'plantelligence-cookie-consent';

// Links exibidos no footer: políticas legais obrigatórias pela LGPD
const footerLinks = [
  {
    href: '/termos',
    label: 'Termos de Uso',
    icon: 'fa-solid fa-file-contract'
  },
  {
    href: '/privacidade',
    label: 'Política de Privacidade',
    icon: 'fa-solid fa-user-shield'
  }
];

// Footer da landing page com banner de consentimento de cookies integrado
const Footer = () => {
  // Controla se o banner de cookies está visível
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  // Armazena a escolha do usuário: 'all' ou 'essential'
  const [consentChoice, setConsentChoice] = useState(null);
  // Ref para o timeout de abertura automática do banner
  const autoOpenTimerRef = useRef(null);
  // Flag para garantir que o banner só renderize no cliente (evita erro de hydration)
  const [isClient, setIsClient] = useState(false);

  // Cancela o timeout de abertura automática se ainda não disparou
  const clearAutoOpenTimer = () => {
    if (autoOpenTimerRef.current) {
      window.clearTimeout(autoOpenTimerRef.current);
      autoOpenTimerRef.current = null;
    }
  };

  // Na montagem: verifica se o usuário já consentiu anteriormente
  useEffect(() => {
    const stored = window.localStorage.getItem(COOKIE_STORAGE_KEY);
    let resolvedChoice = null;

    // Migra o formato antigo 'accepted' para o novo 'all'
    if (stored === 'accepted') {
      resolvedChoice = 'all';
      window.localStorage.setItem(COOKIE_STORAGE_KEY, 'all');
    } else if (stored === 'all' || stored === 'essential') {
      resolvedChoice = stored;
    }

    if (resolvedChoice) {
      // Já consentiu — não precisa mostrar o banner
      setConsentChoice(resolvedChoice);
    } else {
      // Abre o banner após 1,6s para não distrair o usuário na chegada
      autoOpenTimerRef.current = window.setTimeout(() => {
        autoOpenTimerRef.current = null;
        setIsBannerVisible(true);
      }, 1600);
    }

    return () => {
      clearAutoOpenTimer();
    };
  }, []);
  // Marca que estamos no cliente para habilitar o portal do banner
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fecha o banner sem registrar escolha (usuário ignorou)
  const hideBanner = () => {
    clearAutoOpenTimer();
    setIsBannerVisible(false);
  };

  // Registra e persiste a escolha do usuário, depois fecha o banner
  const registerChoice = (choice) => {
    window.localStorage.setItem(COOKIE_STORAGE_KEY, choice);
    setConsentChoice(choice);
    hideBanner();
  };

  // Aceita apenas cookies essenciais (autenticação e sessão)
  const handleEssentialOnly = () => registerChoice('essential');

  // Aceita todos os cookies, incluindo os analíticos
  const handleAcceptAll = () => registerChoice('all');

  // Abre o banner ao clicar no link de Política de Cookies (exceto com modificadores de tecla)
  const handleCookieLink = (event) => {
    // Não intercepta cliques com Ctrl/Cmd/Shift/Alt — esses abrem em nova aba
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    clearAutoOpenTimer();
    setIsBannerVisible(true);
  };

  // Flags para indicar a escolha atual visualmente nos botões do banner
  const isEssentialChoice = consentChoice === 'essential';
  const isAllChoice = consentChoice === 'all';

  // Renderiza o banner via portal diretamente no body para garantir z-index correto
  // Banner fixo na parte inferior da tela com backdrop blur
  const banner = isClient && isBannerVisible
    ? createPortal(
        (
          <div className="pointer-events-auto fixed inset-x-0 bottom-3 z-[1000] flex justify-center px-4">
            <div
              role="dialog"
              aria-modal="false"
              aria-live="polite"
              aria-labelledby="cookie-policy-title"
              className="w-full max-w-2xl rounded-3xl border border-stone-700 bg-[#181415]/95 p-6 shadow-2xl backdrop-blur"
            >
              <div className="flex flex-col gap-4 text-center">
                <div className="space-y-2">
                  {/* Título do banner de consentimento */}
                  <h3 id="cookie-policy-title" className="text-lg font-semibold text-stone-50">
                    Usamos cookies para manter a plataforma operacional
                  </h3>
                  {/* Descrição dos tipos de cookies utilizados */}
                  <p className="text-sm text-stone-300">
                    Utilizamos cookies essenciais para autenticação, segurança de sessão e estabilidade dos painéis de telemetria. Opcionalmente, usamos cookies analíticos para melhorar a operação da plataforma de monitoramento de estufas de cogumelos.
                  </p>
                  {/* Exibe a preferência atual se o usuário já tinha escolhido antes */}
                  {consentChoice ? (
                    <p className="text-xs text-stone-400">
                      Preferência atual: {consentChoice === 'all' ? 'aceitar todos os cookies' : 'permitir apenas cookies essenciais'}.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {/* Link para a página completa de política de cookies */}
                  <Link
                    className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-200 transition hover:border-red-300 hover:text-red-200"
                    to="/cookies"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                    Ver política completa
                  </Link>
                  {/* Botão para aceitar apenas os cookies essenciais */}
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${isEssentialChoice ? 'border-red-300 text-red-200' : 'border-stone-700 text-stone-200 hover:border-red-300 hover:text-red-200'}`}
                    aria-pressed={isEssentialChoice}
                    onClick={handleEssentialOnly}
                  >
                    <i className="fa-solid fa-cookie" aria-hidden="true" />
                    Somente essenciais
                  </button>
                  {/* Botão de aceitar todos — destaque visual maior por ser a ação principal */}
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${isAllChoice ? 'bg-red-400 text-stone-950' : 'bg-red-600 text-red-50 hover:bg-red-500'}`}
                    aria-pressed={isAllChoice}
                    onClick={handleAcceptAll}
                  >
                    <i className="fa-solid fa-check" aria-hidden="true" />
                    Aceitar todos os cookies
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        document.body
      )
    : null;

  // Footer da landing page: informações da plataforma e links de políticas
  return (
    <footer id="rodape" className="border-t border-stone-800/70 bg-[#181415]/95 text-stone-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 md:grid md:grid-cols-[minmax(0,1fr)_0.7fr] md:items-start">
        {/* Bloco da esquerda: identidade e descrição da plataforma */}
        <div className="max-w-md space-y-3 md:justify-self-center md:text-center">
          <span className="text-xs uppercase tracking-[0.24em] text-stone-300/70">Telemetria, Segurança e LGPD</span>
          <h2 className="text-2xl font-semibold text-stone-50">Plantelligence</h2>
          <p className="text-sm text-stone-300">
            Plataforma IoT para automação e monitoramento ambiental de estufas de cogumelos.
          </p>
        </div>
        {/* Bloco da direita: links de políticas legais */}
        <nav aria-label="Políticas da plataforma" className="w-full md:justify-self-center md:text-center">
          <ul className="flex flex-col items-center gap-4">
            {footerLinks.map((item) => (
              <li key={item.href} className="w-full max-w-xs">
                <Link
                  className="group flex w-full items-center justify-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-stone-300 transition hover:border-stone-700 hover:text-stone-50 hover:backdrop-brightness-125"
                  to={item.href}
                >
                  <i className={`${item.icon} text-red-400 transition-colors group-hover:text-red-300`} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            {/* Botão de política de cookies que abre o banner ao clicar */}
            <li className="w-full max-w-xs">
              <button
                type="button"
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-stone-300 transition hover:border-stone-700 hover:text-stone-50 hover:backdrop-brightness-125"
                onClick={handleCookieLink}
              >
                <i className="fa-solid fa-cookie-bite text-red-400 transition-colors group-hover:text-red-300" aria-hidden="true" />
                <span>Política de Cookies</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      {/* Rodapé de copyright */}
      <p className="border-t border-stone-800/70 px-4 py-6 text-center text-xs text-stone-400">© 2026 Plantelligence. Todos os direitos reservados.</p>
      {/* Renderiza o banner de cookies via portal no body */}
      {banner}
    </footer>
  );
};

// Layout das páginas públicas: TopNav no topo, conteúdo no meio e Footer embaixo
const Shell = () => (
  <div className="flex min-h-screen flex-col bg-[#120f0f] text-stone-100 backdrop-blur">
    {/* Barra de navegação pública */}
    <TopNav />
    {/* Outlet renderiza a página filha correspondente à rota atual */}
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

// Layout das páginas de autenticação: TopNav + conteúdo centralizado verticalmente
const AuthShell = () => (
  <div className="flex min-h-screen flex-col bg-[#120f0f] text-stone-100 backdrop-blur">
    <TopNav />
    {/* py-12 garante espaço acima e abaixo do formulário de login/registro */}
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Outlet />
    </main>
  </div>
);

// Wrapper para as rotas protegidas — apenas renderiza o Outlet sem layout adicional
const ProtectedAppContent = () => (
  <>
    <Outlet />
  </>
);

// Guard para páginas de autenticação: redireciona para o dashboard se já estiver logado
const GuestRoute = () => {
  const tokens = useAuthStore((state) => state.tokens);
  // Considera autenticado se houver qualquer formato de access token na store
  const isAuthenticated = Boolean(tokens?.accessToken || tokens?.access_token);

  // Usuário já logado tentando acessar /login ou /register: redireciona para o dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  // Não autenticado: deixa passar para a página de auth
  return <Outlet />;
};

// ErrorBoundary: captura erros de renderização React em qualquer rota filha
// Implementado como classe porque não existe hook equivalente ao getDerivedStateFromError
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // Estado inicial sem erro
    this.state = { error: null };
  }
  // Chamado quando um componente filho lança um erro durante a renderização
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    // Se houver erro, exibe uma tela amigável com a mensagem técnica para debug
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-8 text-sm text-rose-200 max-w-xl">
            <p className="text-lg font-semibold text-rose-100 mb-2">Erro na aplicação</p>
            {/* Exibe a mensagem técnica para facilitar o diagnóstico */}
            <pre className="whitespace-pre-wrap break-all text-xs text-rose-300/80">{this.state.error?.message}</pre>
          </div>
        </div>
      );
    }
    // Sem erro: renderiza os filhos normalmente
    return this.props.children;
  }
}

// Componente principal da aplicação — define o layout global e todas as rotas
const App = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Politica de sessao: idle lock e SESSION_MAX_AGE ──────────────────────
  // Seletores granulares para evitar re-renders desnecessários
  const isAuthenticated = useAuthStore((s) => Boolean(s.tokens?.accessToken || s.tokens?.access_token));
  const isLocked        = useAuthStore((s) => s.isLocked);
  const lockSession     = useAuthStore((s) => s.lockSession);
  const unlockSession   = useAuthStore((s) => s.unlockSession);
  const clearSession    = useAuthStore((s) => s.clearSession);
  const authUser        = useAuthStore((s) => s.user);


  // Rotas protegidas onde o idle timer deve estar ativo
  // Páginas públicas (site, termos, sobre nós, etc.) não devem acionar o lock screen
  const isProtectedRoute = /^\/(dashboard|settings|help|admin)/.test(location.pathname);

  // Bloqueia apos 30 minutos de inatividade (só em rotas protegidas, autenticado e não bloqueado)
  useIdleTimer(
    30 * 60 * 1000,
    () => lockSession('idle'),
    isAuthenticated && !isLocked && isProtectedRoute
  );

  // Detecta token de primeiro acesso na query string e redireciona para a página correta
  useEffect(() => {
    const search = new URLSearchParams(location.search || '');
    // Suporta tanto ?firstAccessToken= quanto ?token= para compatibilidade com links antigos
    const firstAccessToken = (search.get('firstAccessToken') || search.get('token') || '').trim();
    if (!firstAccessToken) {
      return;
    }

    // Evita loop se já estiver na página correta
    const normalizedPath = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (normalizedPath === '/first-access' || normalizedPath === '/password-reset') {
      return;
    }

    // Token de primeiro acesso atual e hexadecimal com 96 chars (48 bytes).
    // Validação superficial para evitar redirecionamentos com tokens claramente inválidos
    const isLikelyFirstAccessToken = /^[a-f0-9]{96}$/i.test(firstAccessToken);
    if (!isLikelyFirstAccessToken) {
      return;
    }

    // Redireciona para o fluxo de primeiro acesso com o token como parâmetro
    navigate(`/first-access?token=${encodeURIComponent(firstAccessToken)}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return (
    <>
      {/* Lock Screen: bloqueio por inatividade (nao destroi sessao) */}
      {/* Renderizado como overlay acima de tudo usando z-[9999] */}
      {isLocked && isAuthenticated && (
        <LockScreen
          user={authUser}
          onUnlock={unlockSession}
          // Ao fazer logout do lock screen, limpa a sessão e vai para o login
          onLogout={() => { clearSession(); navigate('/login', { replace: true }); }}
        />
      )}
    <ErrorBoundary>
      {/* Rola para o topo em cada mudança de rota */}
      <ScrollToTop />
      <Routes>
        {/* Páginas públicas com TopNav + Footer */}
        <Route element={<Shell />}>
          {/* Página inicial: landing page institucional */}
          <Route index element={<TechnologyPage />} />
          <Route path="sobre-nos" element={<AboutPage />} />
          <Route path="fale-conosco" element={<ContactPage />} />
          {/* Páginas legais obrigatórias pela LGPD */}
          <Route path="termos" element={<TermsPage />} />
          <Route path="privacidade" element={<PrivacyPage />} />
          <Route path="cookies" element={<CookiesPage />} />
          <Route path="eula" element={<EulaPage />} />
          <Route path="segurança" element={<SegurancaPage />} />
        </Route>

        {/* Páginas protegidas com DashboardLayout (sem TopNav nem Footer público) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Painel principal: lista de estufas do usuário */}
            <Route path="dashboard" element={<GreenhousesPage />} />
            {/* Wizard de criação de nova estufa */}
            <Route path="dashboard/onboarding" element={<OnboardingGreenhousePage />} />
            {/* Dashboard de telemetria de uma estufa específica */}
            <Route path="dashboard/estufas/:greenhouseId" element={<DashboardPage />} />
            <Route path="dashboard/chat" element={<ChatAIPage />} />
            <Route path="dashboard/presets" element={<PresetsPage />} />
            <Route path="dashboard/relatorios" element={<RelatoriosPage />} />
            <Route path="settings" element={<UserSettingsPage />} />
            <Route path="help" element={<HelpPage />} />
            {/* Rotas exclusivas de Admin — AdminRoute verifica a role do usuário */}
            <Route element={<AdminRoute />}>
              <Route path="admin/usuários" element={<AdminUsersPage />} />
              <Route path="settings/logs" element={<SecurityLogsPage />} />
            </Route>
          </Route>
        </Route>
        {/* Rotas de autenticação: GuestRoute redireciona usuários já logados */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthShell />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="password-reset" element={<PasswordResetPage />} />
            {/* Fluxo de primeiro acesso para usuários convidados pelo admin */}
            <Route path="first-access" element={<FirstAccessPage />} />
          </Route>
        </Route>
        {/* Qualquer rota não mapeada redireciona para a raiz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
    </>
  );
};

export default App;
