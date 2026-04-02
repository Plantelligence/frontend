// Componente raiz da aplicacao, define as rotas e a estrutura principal do app.
import React, { useEffect, useRef, useState, Component } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { PasswordResetPage } from './pages/PasswordResetPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { GreenhousesPage } from './pages/GreenhousesPage.jsx';
import { OnboardingGreenhousePage } from './pages/OnboardingGreenhousePage.jsx';
import { UserSettingsPage } from './pages/UserSettingsPage.jsx';
import { SecurityLogsPage } from './pages/SecurityLogsPage.jsx';
import { AdminUsersPage } from './pages/AdminUsersPage.jsx';
import { ChatAIPage } from './pages/ChatAIPage.jsx';
import { TechnologyPage } from './pages/TechnologyPage.jsx';
import { TermsPage } from './pages/TermsPage.jsx';
import { PrivacyPage } from './pages/PrivacyPage.jsx';
import { CookiesPage } from './pages/CookiesPage.jsx';
import { EulaPage } from './pages/EulaPage.jsx';
import { SegurancaPage } from './pages/SegurancaPage.jsx';
import { TopNav } from './components/TopNav.jsx';
import { ChatbotSupportButton } from './components/ChatbotSupportButton.jsx';
import { ScrollToTop } from './components/ScrollToTop.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AdminRoute } from './components/AdminRoute.jsx';

const COOKIE_STORAGE_KEY = 'plantelligence-cookie-consent';

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

const Footer = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [consentChoice, setConsentChoice] = useState(null);
  const autoOpenTimerRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  const clearAutoOpenTimer = () => {
    if (autoOpenTimerRef.current) {
      window.clearTimeout(autoOpenTimerRef.current);
      autoOpenTimerRef.current = null;
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(COOKIE_STORAGE_KEY);
    let resolvedChoice = null;

    if (stored === 'accepted') {
      resolvedChoice = 'all';
      window.localStorage.setItem(COOKIE_STORAGE_KEY, 'all');
    } else if (stored === 'all' || stored === 'essential') {
      resolvedChoice = stored;
    }

    if (resolvedChoice) {
      setConsentChoice(resolvedChoice);
    } else {
      autoOpenTimerRef.current = window.setTimeout(() => {
        autoOpenTimerRef.current = null;
        setIsBannerVisible(true);
      }, 1600);
    }

    return () => {
      clearAutoOpenTimer();
    };
  }, []);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const hideBanner = () => {
    clearAutoOpenTimer();
    setIsBannerVisible(false);
  };

  const registerChoice = (choice) => {
    window.localStorage.setItem(COOKIE_STORAGE_KEY, choice);
    setConsentChoice(choice);
    hideBanner();
  };

  const handleEssentialOnly = () => registerChoice('essential');

  const handleAcceptAll = () => registerChoice('all');

  const handleCookieLink = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    clearAutoOpenTimer();
    setIsBannerVisible(true);
  };

  const isEssentialChoice = consentChoice === 'essential';
  const isAllChoice = consentChoice === 'all';

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
                  <h3 id="cookie-policy-title" className="text-lg font-semibold text-stone-50">
                    Usamos cookies para manter a plataforma operacional
                  </h3>
                  <p className="text-sm text-stone-300">
                    Utilizamos cookies essenciais para autenticação, segurança de sessão e estabilidade dos painéis de telemetria. Opcionalmente, usamos cookies analíticos para melhorar a operação da plataforma de monitoramento de estufas de cogumelos.
                  </p>
                  {consentChoice ? (
                    <p className="text-xs text-stone-400">
                      Preferência atual: {consentChoice === 'all' ? 'aceitar todos os cookies' : 'permitir apenas cookies essenciais'}.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-200 transition hover:border-red-300 hover:text-red-200"
                    to="/cookies"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                    Ver política completa
                  </Link>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${isEssentialChoice ? 'border-red-300 text-red-200' : 'border-stone-700 text-stone-200 hover:border-red-300 hover:text-red-200'}`}
                    aria-pressed={isEssentialChoice}
                    onClick={handleEssentialOnly}
                  >
                    <i className="fa-solid fa-cookie" aria-hidden="true" />
                    Somente essenciais
                  </button>
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

  return (
    <footer id="rodape" className="border-t border-stone-800/70 bg-[#181415]/95 text-stone-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 md:grid md:grid-cols-[minmax(0,1fr)_0.7fr] md:items-start">
        <div className="max-w-md space-y-3 md:justify-self-center md:text-center">
          <span className="text-xs uppercase tracking-[0.24em] text-stone-300/70">Telemetria, Segurança e LGPD</span>
          <h2 className="text-2xl font-semibold text-stone-50">Plantelligence</h2>
          <p className="text-sm text-stone-300">
            Plataforma IoT para automação e monitoramento ambiental de estufas de cogumelos.
          </p>
        </div>
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
      <p className="border-t border-stone-800/70 px-4 py-6 text-center text-xs text-stone-400">© 2026 Plantelligence. Todos os direitos reservados.</p>
      {banner}
    </footer>
  );
};

const Shell = () => (
  <div className="flex min-h-screen flex-col bg-[#120f0f] text-stone-100 backdrop-blur">
    <TopNav />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const AuthShell = () => (
  <div className="flex min-h-screen flex-col bg-[#120f0f] text-stone-100 backdrop-blur">
    <TopNav />
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const ProtectedAppContent = () => (
  <>
    <Outlet />
    <ChatbotSupportButton />
  </>
);

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-8 text-sm text-rose-200 max-w-xl">
            <p className="text-lg font-semibold text-rose-100 mb-2">Erro na aplicação</p>
            <pre className="whitespace-pre-wrap break-all text-xs text-rose-300/80">{this.state.error?.message}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<TechnologyPage />} />
          <Route path="termos" element={<TermsPage />} />
          <Route path="privacidade" element={<PrivacyPage />} />
          <Route path="cookies" element={<CookiesPage />} />
          <Route path="eula" element={<EulaPage />} />
          <Route path="seguranca" element={<SegurancaPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedAppContent />}>
              <Route path="dashboard" element={<GreenhousesPage />} />
              <Route path="dashboard/onboarding" element={<OnboardingGreenhousePage />} />
              <Route path="dashboard/estufas/:greenhouseId" element={<DashboardPage />} />
              <Route path="dashboard/chat" element={<ChatAIPage />} />
              <Route path="settings" element={<UserSettingsPage />} />
              <Route path="settings/logs" element={<SecurityLogsPage />} />
              <Route element={<AdminRoute />}>
                <Route path="admin/usuarios" element={<AdminUsersPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route element={<AuthShell />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="password-reset" element={<PasswordResetPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
