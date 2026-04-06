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

const buildContext = (entry) => {
  const metadata = entry?.metadata || {};
  const resolved = entry?.metadataResolved || {};
  const highlights = [];

  if (metadata.estufaNome || resolved.estufaNomeResolvida || metadata.estufaId) {
    highlights.push(`Estufa: ${metadata.estufaNome || resolved.estufaNomeResolvida || metadata.estufaId}`);
  }
  if (metadata.targetUserId || resolved.targetUserIdEmail) {
    highlights.push(`Usuário alvo: ${resolved.targetUserIdEmail || metadata.targetUserId}`);
  }
  if (metadata.actorId || resolved.actorIdEmail) {
    highlights.push(`Ator administrativo: ${resolved.actorIdEmail || metadata.actorId}`);
  }
  if (metadata.role) {
    highlights.push(`Perfil executor: ${metadata.role}`);
  }
  if (Array.isArray(resolved.allowedGreenhouses) && resolved.allowedGreenhouses.length > 0) {
    const names = resolved.allowedGreenhouses.map((item) => item.nome || item.id).join(', ');
    highlights.push(`Estufas delegadas: ${names}`);
  }
  if (entry?.ipAddress) {
    highlights.push(`IP de origem: ${entry.ipAddress}`);
  }

  return highlights;
};

export const SecurityLogsPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'Admin';

  const fetchLogs = async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getSecurityLogs(1000);
      setLogs(result.logs ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Não foi possível carregar os logs de segurança.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
        <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
          <div className="rounded-[26px] bg-[#f5f1eb] p-6">
            <h1 className="text-2xl font-semibold text-slate-800">Logs de segurança</h1>
            <p className="mt-2 text-sm text-slate-600">
              Apenas administradores podem acessar trilhas de auditoria e eventos sensíveis do sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
        <header className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Compliance</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-800">Logs de segurança</h1>
              <p className="mt-1 text-sm text-slate-600">
                Trilha de entrada/logoff, senha, autenticador, permissões e ações críticas em estufas.
              </p>
            </div>
            <Button variant="secondary" onClick={fetchLogs} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar logs'}
            </Button>
          </div>

          {error ? (
            <p className="mt-4 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}
        </header>

        <section className="mt-4 rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
          {logs.length === 0 && !loading ? (
            <p className="rounded border border-stone-200 bg-white px-4 py-3 text-sm text-slate-600">
              Nenhum evento encontrado no período consultado.
            </p>
          ) : (
            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {logs.map((entry) => {
                const actionView = getActionView(entry.action);
                const context = buildContext(entry);
                return (
                  <article key={entry.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${actionView.tone}`}>
                        {actionView.title}
                      </span>
                      <span className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</span>
                    </header>

                    <p className="mt-3 text-sm text-slate-700">{actionView.description}</p>

                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <p><strong className="text-slate-700">Executor:</strong> {entry.executorEmail || 'E-mail não disponível'}</p>
                      <p><strong className="text-slate-700">Evento:</strong> {actionView.title}</p>
                    </div>

                    {context.length > 0 ? (
                      <ul className="mt-3 space-y-1 rounded-lg border border-stone-200 bg-[#fcfaf7] p-3 text-xs text-slate-700">
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
      </div>
    </div>
  );
};
