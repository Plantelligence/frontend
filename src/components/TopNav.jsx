///* Cada notificação é um botão clicável que a marca como lida */
///* Usuário não logado fora das páginas de auth: exibe botão de acesso */
/**
 * TopNav - Barra de navegação das páginas públicas (pré-login).
 *
 * Exibe logo, links de navegação (Tecnologia, Sobre Nós, Fale Conosco)
 * e botão de login. Versão mobile com menu hamburguer.
 * Diferente do AppTopBar.jsx que é o header do dashboard pós-login.
 */

// Barra de navegacao superior com menu do usuario, bell de notificações e links principais.
import React, { useCallback, useEffect, useRef, useState } from 'react';
// Link: navegação declarativa sem recarregar a página
// useLocation: para detectar se estamos em uma página de autenticação
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { logout } from '../api/authService.js';
import api from '../api/client.js';

// ── Bell de Notificações ───────────────────────────────────────────────────────

// Formata um timestamp ISO para texto relativo amigável (ex.: "5min", "2h", "12/01")
const fmtTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    // Menos de 1 minuto: exibe "agora"
    if (diffMin < 1) return 'agora';
    // Menos de 1 hora: exibe em minutos
    if (diffMin < 60) return diffMin + 'min';
    // Menos de 24 horas: exibe em horas
    if (diffMin < 1440) return Math.floor(diffMin / 60) + 'h';
    // Mais de 1 dia: exibe data no formato DD/MM
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch { return ''; }
};

// Mapeamento de nível de criticidade para cor do ponto indicador na notificação
const dotColor = { critical: 'bg-rose-500', warning: 'bg-amber-500', info: 'bg-blue-400' };

// Componente do sininho de notificações com dropdown e contador de não lidas
const NotificationBell = ({ userId }) => {
  // Controla se o dropdown de notificações está aberto
  const [open, setOpen] = useState(false);
  // Lista de notificações carregadas do servidor
  const [notifications, setNotifications] = useState([]);
  // Contador de notificações não lidas para o badge vermelho
  const [unread, setUnread] = useState(0);
  // Ref para detectar cliques fora do dropdown e fechá-lo
  const bellRef = useRef(null);

  // Busca as notificações mais recentes do servidor
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get('/notifications', { params: { limit: 15 } });
      // Normaliza a resposta que pode vir em formatos diferentes
      const items = res.data?.notifications ?? res.data?.items ?? [];
      setNotifications(items);
      // Conta quantas ainda não foram marcadas como lidas
      setUnread(items.filter((n) => !n.read).length);
    } catch { }
  }, [userId]);

  // Busca notificações na montagem e a cada 60 segundos (polling simples)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fecha o dropdown ao clicar fora dele
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Marca todas as notificações como lidas de uma vez
  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      // Atualiza o estado local sem precisar recarregar do servidor
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch { }
  };

  // Marca uma notificação específica como lida ao clicar nela
  const markRead = async (id) => {
    try {
      await api.patch('/notifications/' + id + '/read');
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      // Decrementa o contador, garantindo que não fique negativo
      setUnread((prev) => Math.max(0, prev - 1));
    } catch { }
  };

  // Remove todas as notificações da lista do usuário
  const clearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnread(0);
    } catch { }
  };

  // Não renderiza nada se não houver usuário logado
  if (!userId) return null;

  return (
    <div ref={bellRef} className="relative">
      {/* Botão do sininho com badge de contagem de não lidas */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-stone-700 bg-[#241918] text-stone-300 transition hover:border-red-500 hover:text-red-200"
        aria-label="Notificações"
      >
        <i className="fa-solid fa-bell text-sm" />
        {/* Badge vermelho com contagem de não lidas */}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown de notificações — visível quando open=true */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-stone-700 bg-[#1a1210] shadow-2xl border-stone-600">
          {/* Cabeçalho do dropdown com ações */}
          <div className="flex items-center justify-between border-b border-stone-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-bell text-red-400 text-sm" />
              <span className="text-sm font-semibold text-stone-100">Notificações</span>
              {/* Badge com contagem de novas */}
              {unread > 0 && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                  {unread} nova{unread !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Botão de marcar todas como lidas — visível apenas se houver não lidas */}
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] text-stone-400 transition hover:text-stone-200">
                  Marcar lidas
                </button>
              )}
              {/* Botão de limpar todas — visível apenas se houver notificações */}
              {notifications.length > 0 && (
                <button type="button" onClick={clearAll} className="text-[11px] text-rose-400/70 transition hover:text-rose-300">
                  <i className="fa-solid fa-trash-can mr-1" />Limpar
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificações com scroll interno */}
          <div className="max-h-80 overflow-y-auto">
            {/* Estado vazio: nenhuma notificação */}
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
                    {/* Ponto colorido indicando a criticidade da notificação */}
                    <span className={'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ' + (dotColor[n.severity] || 'bg-blue-400')} />
                    <div className="min-w-0 flex-1">
                      {/* Título em branco se não lida, cinza se já lida */}
                      <p className={'text-xs font-semibold leading-snug ' + (n.read ? 'text-stone-400' : 'text-stone-100')}>
                        {n.title}
                      </p>
                      {/* Mensagem resumida com clamp de 2 linhas */}
                      <p className="mt-0.5 text-[11px] leading-snug text-stone-500 line-clamp-2">{n.message}</p>
                      {/* Timestamp formatado de forma relativa */}
                      <p className="mt-1 text-[10px] text-stone-600 dark:text-stone-400">{fmtTime(n.createdAt ?? n.created_at)}</p>
                    </div>
                    {/* Indicador visual de não lida no canto direito */}
                    {!n.read && <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-500" />}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Rodapé do dropdown com link para logs de segurança */}
          <div className="border-t border-stone-700 px-4 py-2.5">
            <p className="text-center text-[10px] text-stone-600 dark:text-stone-400 mb-1.5">
              <i className="fa-solid fa-clock mr-1" />Notificações retidas por 30 dias
            </p>
            {/* Link para a página de logs completos */}
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
  // Extrai estado de autenticação da store global
  const { user, tokens, clearSession } = useAuthStore((state) => ({
    user: state.user,
    tokens: state.tokens,
    clearSession: state.clearSession
  }));
  const navigate = useNavigate();
  const location = useLocation();
  // Controla a abertura/fechamento do menu dropdown do usuário
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Detecta se estamos em uma das páginas de autenticação para ocultar o botão de login
  const isAuthPage = ['/login', '/register', '/password-reset', '/first-access'].some(
    (p) => location.pathname.startsWith(p)
  );

  // Encerra a sessão do usuário: invalida o token no servidor e limpa o estado local
  const handleLogout = async () => {
    try {
      // Refresh token no httpOnly cookie — backend limpa o cookie automaticamente (B3.6)
      await logout({ accessJti: tokens?.accessJti, userId: user?.id });
    } catch (error) {
      // Mesmo que o logout falhe no servidor, limpa o estado local
      console.warn('Erro ao encerrar sessão', error);
    } finally {
      setMenuOpen(false);
      clearSession();
      navigate('/login');
    }
  };

  // Fecha o menu ao perder o foco para todos os elementos filhos
  const handleMenuBlur = (event) => {
    if (!menuRef.current) return;
    const nextTarget = event.relatedTarget;
    // Só fecha se o foco saiu completamente do menu (não para um filho dele)
    if (!nextTarget || !menuRef.current.contains(nextTarget)) setMenuOpen(false);
  };

  // Fecha o menu ao pressionar Escape para acessibilidade de teclado
  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); }
  };

  // Header sticky com backdrop blur - visível em todas as páginas públicas
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-stone-700/50 bg-[#181415]/95 px-5 backdrop-blur">
      {/* Logo clicável que volta para a página inicial */}
      <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-red-400">
        <img src="/logo.svg" alt="" aria-hidden="true" className="h-5 w-5" />
        <span className="text-sm font-bold tracking-widest">PLANTELLIGENCE</span>
      </Link>
      {/* Área direita: links de nav + ações do usuário */}
      <nav className="flex items-center gap-3 text-sm text-stone-300 md:gap-4">
        {/* Link "Sobre Nós" — oculto no mobile para não poluir a barra */}
        <Link to="/sobre-nos" className="hidden rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-stone-400 transition hover:text-red-300 md:inline-flex">
          SOBRE NÓS
        </Link>
        {/* Se o usuário está logado: exibe sininho + menu de conta */}
        {user ? (
          <>
            {/* Componente de notificações com polling automático */}
            <NotificationBell userId={user?.id} />
            {/* Menu dropdown com links de conta e logout */}
            <div className="relative" ref={menuRef} onBlur={handleMenuBlur} onKeyDown={handleMenuKeyDown}>
              {/* Botão de abertura do dropdown com nome do usuário */}
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-stone-700/60 bg-[#241918]/60 px-3 py-1.5 text-xs font-medium text-stone-300 transition hover:border-red-500/60 hover:text-red-200"
                aria-expanded={menuOpen ? 'true' : 'false'}
                aria-haspopup="menu"
              >
                {/* Primeiro nome do usuário — fallback para prefixo do email */}
                <span className="hidden md:inline">{user.fullName?.split(' ')[0] || user.email?.split('@')[0] || 'Conta'}</span>
                <span className="md:hidden">{user.fullName?.split(' ')[0] || user.email?.split('@')[0] || 'Conta'}</span>
                {/* Chevron como indicador visual de dropdown */}
                <span className="text-red-400">&#9660;</span>
              </button>
              {/* Dropdown: renderizado condicionalmente para evitar custo de DOM desnecessário */}
              {menuOpen ? (
                <div role="menu" className="absolute right-0 mt-3 w-56 rounded-xl border border-stone-700 bg-[#181415]/95 p-2 text-sm text-stone-200 shadow-xl">
                  {/* Cabeçalho com informações do usuário */}
                  <div className="border-b border-stone-700 px-3 py-3">
                    <p className="text-xs font-semibold text-stone-100">{user.fullName ?? user.email}</p>
                    <p className="text-[10px] text-stone-400">{user.email}</p>
                    {/* Nome da organização em vermelho para identificação rápida */}
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-400">{user.organizationName || 'Sem organização'}</p>
                  </div>
                  {/* Links de navegação do menu */}
                  <div className="py-1">
                    <Link to="/dashboard" className="flex items-center gap-2 rounded px-3 py-2 text-xs transition hover:bg-[#241918] hover:text-red-100" onClick={() => setMenuOpen(false)} role="menuitem">
                      <i className="fa-solid fa-house w-4 text-center" />Espaço da organização
                    </Link>
                    <Link to="/settings" className="flex items-center gap-2 rounded px-3 py-2 text-xs transition hover:bg-[#241918] hover:text-red-100" onClick={() => setMenuOpen(false)} role="menuitem">
                      <i className="fa-solid fa-gear w-4 text-center" />Configurações
                    </Link>
                    {/* Links de admin: visíveis apenas para usuários com role Admin */}
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
                  {/* Área de logout separada por borda para destaque visual */}
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
