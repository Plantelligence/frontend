/**
 * MfaReconfirmModal - Overlay de confirmação MFA para ações críticas.
 *
 * Exibido quando o usuário tenta executar uma ação crítica (ex: excluir usuário,
 * desativar organização). Solicita o código MFA do autenticador (TOTP) ou,
 * alternativamente, envia um código por e-mail — o mesmo fluxo do login.
 *
 * Após verificação bem-sucedida, emite novos tokens com sca=now e chama onConfirm().
 * O authStore é atualizado para que require_recent_mfa passe na próxima requisição.
 *
 * Props:
 *   title       {string}   — Título da ação (ex: "Excluir usuário")
 *   description {string}   — Descrição do risco (ex: "Esta ação é irreversível...")
 *   onConfirm   {Function} — Chamado com os novos tokens após MFA bem-sucedido
 *   onCancel    {Function} — Chamado se o usuário cancelar
 */

import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';

const MAX_ATTEMPTS = 5;

export const MfaReconfirmModal = ({ title, description, onConfirm, onCancel }) => {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  // method: "totp" | "email"
  const [method, setMethod]           = useState('totp');
  const [code, setCode]               = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [attempts, setAttempts]       = useState(0);

  // estado do fluxo e-mail
  const [emailStep, setEmailStep]     = useState('idle'); // 'idle' | 'sending' | 'ready'
  const [challengeId, setChallengeId] = useState(null);
  const [emailDebug, setEmailDebug]   = useState(null);

  const inputRef = useRef(null);

  // foca o campo de código ao montar / trocar de método
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [method, emailStep]);

  // logout automático após MAX_ATTEMPTS erros
  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) {
      setError(`${MAX_ATTEMPTS} tentativas incorretas. Ação bloqueada por segurança.`);
    }
  }, [attempts]);

  const initials = (user?.fullName || user?.email || 'U')
    .split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

  // ── Solicitar código por e-mail ──────────────────────────────────────────────
  const requestEmailCode = async () => {
    setEmailStep('sending');
    setError(null);
    try {
      const res = await api.post('/auth/mfa-reconfirm/initiate');
      setChallengeId(res.data.challengeId);
      setEmailDebug(res.data.debugCode ?? null);
      setEmailStep('ready');
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 120);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Não foi possível enviar o código. Tente novamente.');
      setEmailStep('idle');
    }
  };

  // ── Mudar para método e-mail ─────────────────────────────────────────────────
  const switchToEmail = async () => {
    setMethod('email');
    setCode('');
    setError(null);
    await requestEmailCode();
  };

  // ── Mudar para TOTP ──────────────────────────────────────────────────────────
  const switchToTotp = () => {
    setMethod('totp');
    setCode('');
    setError(null);
    setEmailStep('idle');
    setChallengeId(null);
  };

  // ── Verificar código ─────────────────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim() || loading || attempts >= MAX_ATTEMPTS) return;

    // e-mail: garante que o challenge foi criado
    if (method === 'email' && (!challengeId || emailStep !== 'ready')) return;

    setLoading(true);
    setError(null);

    try {
      const body = { method, code: code.trim() };
      if (method === 'email') body.challengeId = challengeId;

      const res = await api.post('/auth/mfa-reconfirm/verify', body);
      const { user: freshUser, tokens } = res.data;

      // Atualiza o authStore com os novos tokens (sca = agora)
      setSession({ user: freshUser, tokens });

      setCode('');
      onConfirm?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Código inválido. Tente novamente.';
      setAttempts((prev) => prev + 1);
      setError(msg);
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = code.trim().length >= 6 && !loading && attempts < MAX_ATTEMPTS &&
    (method === 'totp' || (method === 'email' && emailStep === 'ready'));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#0c0909]/95 backdrop-blur-sm py-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfa-reconfirm-title"
    >
      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-amber-600/6 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle,#f59e0b 1px,transparent 1px)', backgroundSize: '30px 30px' }}
        />
      </div>

      <div className="relative w-full max-w-sm px-4">
        <div className="rounded-3xl border border-stone-800/60 bg-stone-900/85 p-8 shadow-2xl backdrop-blur">

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/80 border border-red-800/40">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <ellipse cx="12" cy="10" rx="8" ry="6" fill="#ef4444" opacity="0.9" />
                <ellipse cx="12" cy="11" rx="7" ry="2" fill="#1a0000" opacity="0.5" />
                <rect x="9.5" y="13" width="5" height="7" rx="2" fill="#b91c1c" opacity="0.7" />
                <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/20 border-2 border-amber-500/30 text-base font-bold text-amber-400">
              {initials}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-stone-100">{user?.fullName || 'Administrador'}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{user?.email || ''}</p>
            </div>
          </div>

          {/* Cabeçalho de segurança */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/8 px-3 py-1 mb-3">
              <i className="fa-solid fa-shield-halved text-amber-400 text-[11px]" />
              <span className="text-[11px] font-semibold text-amber-400">Ação crítica: verificação necessária</span>
            </div>
            <h1 id="mfa-reconfirm-title" className="text-base font-bold text-stone-100">
              {title || 'Confirmar ação crítica'}
            </h1>
            {description && (
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{description}</p>
            )}
          </div>

          {/* ── Método TOTP ── */}
          {method === 'totp' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                  <i className="fa-solid fa-mobile-screen-button mr-1.5" />
                  Código do autenticador
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  disabled={loading || attempts >= MAX_ATTEMPTS}
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-stone-100 placeholder:text-stone-600 placeholder:tracking-[0.3em] outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50"
                />
                <p className="text-[10px] text-stone-600 text-center">
                  Abra o app autenticador e informe o código de 6 dígitos.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                  <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin text-xs" />Verificando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-check-shield text-xs" />Confirmar
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={switchToEmail}
                disabled={loading}
                className="w-full text-xs text-stone-500 hover:text-stone-300 transition py-1"
              >
                <i className="fa-solid fa-envelope mr-1.5" />
                Usar código por e-mail
              </button>
            </form>
          )}

          {/* ── Método e-mail ── */}
          {method === 'email' && (
            <div className="space-y-4">
              {emailStep === 'sending' && (
                <div className="flex flex-col items-center gap-3 py-4 text-stone-400">
                  <i className="fa-solid fa-spinner fa-spin text-2xl text-amber-500" />
                  <p className="text-sm">Enviando código por e-mail...</p>
                </div>
              )}

              {(emailStep === 'idle' || emailStep === 'ready') && (
                <form onSubmit={handleVerify} className="space-y-4">
                  {emailStep === 'ready' && (
                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/8 px-3 py-2.5 text-xs text-sky-300 text-center">
                      <i className="fa-solid fa-envelope-open-text mr-1.5" />
                      Código enviado para <span className="font-semibold">{user?.email}</span>
                      {emailDebug && (
                        <div className="mt-1 font-mono text-amber-400">DEBUG: {emailDebug}</div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                      <i className="fa-solid fa-envelope mr-1.5" />
                      Código de verificação
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      disabled={loading || attempts >= MAX_ATTEMPTS || emailStep !== 'ready'}
                      autoComplete="one-time-code"
                      className="w-full rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-stone-100 placeholder:text-stone-600 placeholder:tracking-[0.3em] outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50"
                    />
                    {emailStep === 'ready' && (
                      <button
                        type="button"
                        onClick={requestEmailCode}
                        disabled={loading}
                        className="text-[10px] text-stone-600 hover:text-stone-400 transition text-center"
                      >
                        Não recebeu? Reenviar código
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                      <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-40"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin text-xs" />Verificando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-check-shield text-xs" />Confirmar
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={switchToTotp}
                    disabled={loading}
                    className="w-full text-xs text-stone-500 hover:text-stone-300 transition py-1"
                  >
                    <i className="fa-solid fa-mobile-screen-button mr-1.5" />
                    Usar autenticador (TOTP)
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Cancelar */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => onCancel?.()}
              className="text-xs text-stone-600 hover:text-stone-400 transition underline underline-offset-2"
            >
              Cancelar ação
            </button>
          </div>

        </div>

        <p className="mt-4 text-center text-[10px] text-stone-700">
          Sessão protegida · Plantelligence · LGPD
        </p>
      </div>
    </div>
  );
};

export default MfaReconfirmModal;
