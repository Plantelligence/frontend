/**
 * SecurityLogsPage - Trilha de auditoria do sistema.
 *
 * Exibe os eventos de segurança registrados no banco:
 *   login, logout, MFA, troca de senha, alterações de organização etc.
 * Admin vê logs de toda a organização; usuário comum vê apenas os seus.
 * Filtros: por ação e por período de data.
 *
 * Rota: /settings/logs
 */

import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore.js';
import { getSecurityLogs } from '../api/userService.js';

const actionPresentation = {
  user_registered: ['Conta registrada', 'Novo usuário foi registrado na plataforma.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  registration_started: ['Cadastro iniciado', 'Fluxo de cadastro foi iniciado para novo usuário.', 'border-sky-200 bg-sky-50 text-sky-700'],
  registration_email_failed: ['Falha no envio de e-mail de cadastro', 'O sistema não conseguiu enviar o e-mail de cadastro.', 'border-rose-200 bg-rose-50 text-rose-700'],
  registration_email_skipped: ['Envio de e-mail de cadastro ignorado', 'Cadastro criado sem envio de e-mail por configuração SMTP.', 'border-amber-200 bg-amber-50 text-amber-700'],
  login_success: ['Login autorizado', 'Usuário autenticou com sucesso no sistema.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  login_failed: ['Falha de login', 'Tentativa de entrada negada por credencial inválida.', 'border-rose-200 bg-rose-50 text-rose-700'],
  login_blocked_user: ['Acesso bloqueado', 'Usuário bloqueado tentou entrar na plataforma.', 'border-rose-200 bg-rose-50 text-rose-700'],
  mfa_session_created: ['Sessão MFA iniciada', 'Usuário entrou na etapa de segundo fator.', 'border-sky-200 bg-sky-50 text-sky-700'],
  mfa_verified: ['MFA validado', 'Segundo fator foi validado com sucesso.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  mfa_totp_enrollment_started: ['Cadastro de autenticador iniciado', 'Usuário iniciou configuração do app autenticador.', 'border-sky-200 bg-sky-50 text-sky-700'],
  mfa_code_sent: ['Código MFA enviado', 'Código de verificação MFA foi enviado ao usuário.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  mfa_delivery_failed: ['Falha no envio de MFA', 'Houve erro ao enviar o código MFA.', 'border-rose-200 bg-rose-50 text-rose-700'],
  mfa_delivery_skipped: ['Envio de MFA ignorado', 'Sistema pulou envio por falta de configuração SMTP.', 'border-amber-200 bg-amber-50 text-amber-700'],
  mfa_challenge_missing: ['Desafio MFA não encontrado', 'Desafio informado não existe ou já foi removido.', 'border-rose-200 bg-rose-50 text-rose-700'],
  mfa_code_expired: ['Código MFA expirado', 'Validação MFA falhou por expiração do código.', 'border-rose-200 bg-rose-50 text-rose-700'],
  mfa_challenge_locked: ['Desafio MFA bloqueado', 'MFA bloqueado por excesso de tentativas inválidas.', 'border-rose-200 bg-rose-50 text-rose-700'],
  mfa_code_invalid: ['Código MFA inválido', 'Código MFA informado não confere.', 'border-rose-200 bg-rose-50 text-rose-700'],
  session_refreshed: ['Sessão renovada', 'Token de acesso renovado com sucesso.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  session_revoked: ['Sessão revogada', 'Sessão encerrada ou token invalidado.', 'border-amber-200 bg-amber-50 text-amber-700'],
  refresh_token_issued: ['Refresh token emitido', 'Novo refresh token foi emitido para a sessão.', 'border-sky-200 bg-sky-50 text-sky-700'],
  first_access_started: ['Primeiro acesso iniciado', 'Usuário iniciou fluxo de primeiro acesso.', 'border-sky-200 bg-sky-50 text-sky-700'],
  first_access_completed: ['Primeiro acesso concluído', 'Usuário finalizou senha inicial e MFA.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  password_changed: ['Senha alterada', 'Usuário alterou a própria senha com sucesso.', 'border-amber-200 bg-amber-50 text-amber-700'],
  password_reset_requested: ['Recuperação de senha solicitada', 'Foi solicitado token para redefinição de senha.', 'border-sky-200 bg-sky-50 text-sky-700'],
  password_reset_completed: ['Recuperação de senha concluída', 'Senha redefinida com sucesso via token.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  password_reset_blocked_user: ['Recuperação negada para usuário bloqueado', 'Solicitação de reset negada por conta bloqueada.', 'border-rose-200 bg-rose-50 text-rose-700'],
  greenhouse_accessed: ['Acesso a estufa', 'Usuário abriu os detalhes de uma estufa.', 'border-sky-200 bg-sky-50 text-sky-700'],
  greenhouse_created: ['Estufa criada', 'Nova estufa registrada no ambiente da organização.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  greenhouse_updated: ['Estufa atualizada', 'Dados da estufa foram alterados por um usuário.', 'border-amber-200 bg-amber-50 text-amber-700'],
  greenhouse_deleted: ['Estufa removida', 'Estufa excluída do cadastro.', 'border-rose-200 bg-rose-50 text-rose-700'],
  reader_greenhouse_access_updated: ['Delegação de leitor alterada', 'Lista de estufas permitidas para leitor foi atualizada.', 'border-amber-200 bg-amber-50 text-amber-700'],
  user_role_updated: ['Nível de acesso alterado', 'Perfil de usuário alterado por administrador.', 'border-amber-200 bg-amber-50 text-amber-700'],
  user_access_status_updated: ['Status de acesso alterado', 'Conta de usuário foi bloqueada ou desbloqueada.', 'border-amber-200 bg-amber-50 text-amber-700'],
  user_profile_updated: ['Perfil atualizado', 'Dados cadastrais ou consentimento foram atualizados.', 'border-amber-200 bg-amber-50 text-amber-700'],
  admin_user_created: ['Usuário criado por administrador', 'Administrador criou uma nova conta na organização.', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  admin_user_deleted: ['Usuário removido por administrador', 'Conta foi removida e dados remanejados conforme política.', 'border-rose-200 bg-rose-50 text-rose-700'],
  admin_user_invite_failed: ['Falha no envio de convite', 'Não foi possível enviar convite de acesso para o usuário.', 'border-rose-200 bg-rose-50 text-rose-700'],
  admin_user_invite_resent: ['Convite reenviado', 'Administrador reenviou convite de primeiro acesso.', 'border-amber-200 bg-amber-50 text-amber-700'],
  organization_deactivated_by_owner: ['Organização desativada', 'Administrador principal desativou a organização.', 'border-rose-200 bg-rose-50 text-rose-700'],
  demo_organization_expired: ['Ambiente de demonstração expirado', 'Organização demo foi expirada automaticamente.', 'border-rose-200 bg-rose-50 text-rose-700'],
  data_deletion_requested: ['Solicitação de exclusão registrada', 'Usuário solicitou exclusão de dados.', 'border-amber-200 bg-amber-50 text-amber-700']
};

const getActionView = (action = '') => {
  const mapped = actionPresentation[action];
  if (mapped) {
    return { title: mapped[0], description: mapped[1], tone: mapped[2] };
  }

  const normalized = String(action).toLowerCase();
  if (normalized.includes('fail') || normalized.includes('blocked') || normalized.includes('expired') || normalized.includes('invalid')) {
    return { title: action, description: 'Evento crítico de segurança.', tone: 'border-rose-200 bg-rose-50 text-rose-700' };
  }
  if (normalized.includes('update') || normalized.includes('changed') || normalized.includes('revoked') || normalized.includes('deleted')) {
    return { title: action, description: 'Evento de alteração administrativa.', tone: 'border-amber-200 bg-amber-50 text-amber-700' };
  }
  return { title: action, description: 'Evento operacional registrado com sucesso.', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Data não registrada';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toLocaleString();
};

// Verifica se um valor parece um UUID bruto (não deve ser exibido ao usuário)
const isRawUUID = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// Mapas de tradução para valores técnicos
const ROLE_LABELS = { Admin: 'Administrador', Collaborator: 'Colaborador', Reader: 'Leitor' };
const METHOD_LABELS = { email: 'Código por e-mail', totp: 'Autenticador (TOTP)', password: 'Senha atual' };
const REASON_LABELS = {
  invalid_password: 'Senha incorreta',
  unknown_email: 'E-mail não encontrado',
  smtp_not_configured: 'SMTP não configurado',
};

const buildContext = (entry) => {
  const metadata = entry?.metadata || {};
  const resolved = entry?.metadataResolved || {};
  const highlights = [];

  // Estufa envolvida
  const estufaNome = metadata.estufaNome || resolved.estufaNomeResolvida;
  if (estufaNome) highlights.push(`Estufa: ${estufaNome}`);
  else if (metadata.estufaId && !isRawUUID(metadata.estufaId)) highlights.push(`Estufa: ${metadata.estufaId}`);

  // Usuário alvo (preferir email ao ID)
  const targetEmail = resolved.targetUserIdEmail || metadata.targetEmail || metadata.usuarioAlvo;
  if (targetEmail && !isRawUUID(targetEmail)) highlights.push(`Usuário alvo: ${targetEmail}`);

  // Ator administrativo
  const actorEmail = resolved.actorIdEmail || resolved.actorUserIdEmail;
  if (actorEmail && !isRawUUID(actorEmail)) highlights.push(`Executor: ${actorEmail}`);

  // E-mail envolvido (registro, reset de senha etc.)
  if (metadata.email && !isRawUUID(metadata.email)) highlights.push(`E-mail: ${metadata.email}`);

  // Perfil/cargo
  if (metadata.role) highlights.push(`Perfil: ${ROLE_LABELS[metadata.role] || metadata.role}`);

  // Estufas delegadas (lista de nomes)
  if (Array.isArray(resolved.allowedGreenhouses) && resolved.allowedGreenhouses.length > 0) {
    const names = resolved.allowedGreenhouses.map((g) => g.nome || (isRawUUID(g.id) ? '(estufa)' : g.id)).join(', ');
    highlights.push(`Estufas delegadas: ${names}`);
  } else if (Array.isArray(metadata.estufasDelegadas) && metadata.estufasDelegadas.length > 0) {
    const names = metadata.estufasDelegadas.filter((n) => !isRawUUID(n)).join(', ');
    if (names) highlights.push(`Estufas delegadas: ${names}`);
  }

  // Método de verificação
  if (metadata.method) highlights.push(`Método: ${METHOD_LABELS[metadata.method] || metadata.method}`);
  if (metadata.verificationMethod) highlights.push(`Verificação: ${METHOD_LABELS[metadata.verificationMethod] || metadata.verificationMethod}`);

  // Motivo (em eventos de falha)
  if (metadata.reason) highlights.push(`Motivo: ${REASON_LABELS[metadata.reason] || metadata.reason}`);

  // Convite enviado
  if (metadata.inviteSent === true) highlights.push('Convite enviado por e-mail');
  if (metadata.inviteSent === false) highlights.push('Convite não enviado (SMTP indisponível)');

  // Senha expirada
  if (metadata.passwordExpired === true) highlights.push('Senha expirada — redefinição necessária');

  // Bloqueio de usuário
  if (metadata.blocked !== undefined) highlights.push(metadata.blocked ? 'Conta bloqueada' : 'Conta desbloqueada');

  // IP de origem
  if (entry?.ipAddress) highlights.push(`IP de origem: ${entry.ipAddress}`);

  return highlights;
};

export const SecurityLogsPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [untilDate, setUntilDate] = useState('');

  const isAdmin = user?.role === 'Admin';

  // Data mínima: 90 dias atrás
  const minDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const maxDate = new Date().toISOString().slice(0, 10);

  const fetchLogs = async (fd, ud) => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getSecurityLogs(1000, fd || null, ud || null);
      setLogs(result.logs ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Não foi possível carregar os logs de segurança.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchLogs('', '');
  }, [isAdmin]);

  if (!isAdmin) {
    return (
          <div className="rounded-[26px] bg-stone-50/30 dark:bg-[#0f0c0c] p-4 md:p-6">
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-stone-100">Logs de segurança</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
              Apenas administradores podem acessar trilhas de auditoria e eventos sensíveis do sistema.
            </p>
          </div>
    );
  }

  return (
    <>
        <header className="rounded-[26px] bg-stone-50/50 dark:bg-[#0f0c0c] p-5 md:p-6 space-y-4">
          {/* Título */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Compliance</p>
              <h1 className="mt-1 text-2xl font-semibold text-stone-800 dark:text-stone-100">Logs de segurança</h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Trilha de entrada/logoff, senha, autenticador, permissões e ações críticas em estufas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchLogs(fromDate, untilDate)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-700/60 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:border-red-400 hover:text-red-600 dark:hover:border-red-500/40 dark:hover:text-red-400 disabled:opacity-40 transition"
            >
              <i className={`fa-solid fa-rotate-right text-xs ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Banner de retenção — 90 dias */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong className="font-semibold text-amber-800 dark:text-amber-300">Política de retenção: 90 dias.</strong>
              <span className="ml-1 text-amber-700 dark:text-amber-400">
                Informações de auditoria são retidas por até 90 dias a partir do evento. Após esse prazo são removidas permanentemente e não podem ser recuperadas.
              </span>
            </div>
          </div>

          {/* Filtros de data */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">De</label>
              <input
                type="date"
                value={fromDate}
                min={minDate}
                max={untilDate || maxDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 dark:border-stone-700/60 dark:bg-stone-800/60 dark:text-stone-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Até</label>
              <input
                type="date"
                value={untilDate}
                min={fromDate || minDate}
                max={maxDate}
                onChange={(e) => setUntilDate(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 dark:border-stone-700/60 dark:bg-stone-800/60 dark:text-stone-100"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchLogs(fromDate, untilDate)}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 transition"
            >
              <i className="fa-solid fa-magnifying-glass mr-1.5 text-xs" />
              Filtrar
            </button>
            {(fromDate || untilDate) && (
              <button
                type="button"
                onClick={() => { setFromDate(''); setUntilDate(''); fetchLogs('', ''); }}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-500 hover:bg-stone-50 transition dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
              >
                Limpar filtro
              </button>
            )}
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {fromDate || untilDate
                ? `Período: ${fromDate || 'início'} → ${untilDate || 'hoje'}`
                : 'Exibindo os últimos 90 dias'}
            </p>
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>
          ) : null}
        </header>

        <section className="mt-4 rounded-2xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-5">
          {logs.length === 0 && !loading ? (
            <p className="rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-800/40 dark:bg-stone-900/25 px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
              Nenhum evento encontrado no período consultado.
            </p>
          ) : (
            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {logs.map((entry) => {
                const actionView = getActionView(entry.action);
                const context = buildContext(entry);
                return (
                  <article key={entry.id} className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-4">
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${actionView.tone}`}>
                        {actionView.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-stone-400">{formatDateTime(entry.createdAt)}</span>
                    </header>

                    <p className="mt-3 text-sm text-slate-700 dark:text-stone-300">{actionView.description}</p>

                    <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-stone-400 sm:grid-cols-2">
                      <p><strong className="text-slate-700 dark:text-stone-300">Executor:</strong> {entry.executorEmail || 'E-mail não disponível'}</p>
                      <p><strong className="text-slate-700 dark:text-stone-300">Evento:</strong> {actionView.title}</p>
                    </div>

                    {context.length > 0 ? (
                      <ul className="mt-3 space-y-1 rounded-lg border border-stone-200 bg-stone-50 dark:bg-stone-800/40 p-3 text-xs text-slate-700 dark:text-stone-300">
                        {context.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
    </>
  );
};
