/**
 * LockScreen - Overlay de bloqueio por inatividade.
 *
 * Exibido apos SESSION_IDLE_MINUTES de inatividade (default: 30 min).
 * Solicita APENAS a senha para desbloquear — sem MFA.
 *
 * BALANCAMENTO UX / SEGURANCA:
 *   - A sessao JWT permanece valida durante o bloqueio.
 *   - Apenas a senha e exigida (MFA seria excessivo para idle curto).
 *   - 5 tentativas erradas forcam logout completo (proteção brute-force).
 *   - O usuario pode optar por "Sair" para logout completo a qualquer momento.
 *   - Mostra o nome e email do usuario para evitar confusao em maquinas compartilhadas.
 *
 * Props:
 *   user        {object}   - Usuario logado (name, email, avatarUrl)
 *   onUnlock    {Function} - Chamado ao desbloquear com sucesso
 *   onLogout    {Function} - Chamado se o usuario escolher sair
 */

import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';

const MAX_ATTEMPTS = 5;

export const LockScreen = ({ user, onUnlock, onLogout }) => {
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [attempts, setAttempts]     = useState(0);
  const [showPass, setShowPass]     = useState(false);
  const inputRef = useRef(null);

  // Foca o campo de senha ao montar
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // Se exceder tentativas, forca logout automaticamente
  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) {
      setError(`${MAX_ATTEMPTS} tentativas incorretas. Encerrando sessão por segurança.`);
      const t = setTimeout(() => onLogout?.(), 2000);
      return () => clearTimeout(t);
    }
  }, [attempts, onLogout]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password.trim() || loading || attempts >= MAX_ATTEMPTS) return;

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/unlock', {
        email: user?.email ?? '',
        password,
      });
      setPassword('');
      onUnlock?.();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Senha incorreta. Tente novamente.';
      setAttempts((prev) => prev + 1);
      setError(msg);
      setPassword('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const remaining = MAX_ATTEMPTS - attempts;

  // Iniciais do avatar
  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#0c0909]/95 backdrop-blur-sm py-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
    >
      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-red-600/8 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle,#ef4444 1px,transparent 1px)', backgroundSize: '30px 30px' }}
        />
      </div>

      {/* Card principal */}
      <div className="relative w-full max-w-sm px-4">
        <div className="rounded-3xl border border-stone-800/60 bg-stone-900/80 p-8 shadow-2xl backdrop-blur">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/80 border border-red-800/40">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <ellipse cx="12" cy="10" rx="8" ry="6" fill="#ef4444" opacity="0.9" />
                <ellipse cx="12" cy="11" rx="7" ry="2" fill="#1a0000" opacity="0.5" />
                <rect x="9.5" y="13" width="5" height="7" rx="2" fill="#b91c1c" opacity="0.7" />
                <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Avatar do usuario */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/20 border-2 border-red-500/30 text-lg font-bold text-red-400">
              {initials}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-stone-100">{user?.name || 'Operador'}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{user?.email || ''}</p>
            </div>
          </div>

          {/* Titulo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/8 px-3 py-1 mb-3">
              <i className="fa-solid fa-lock text-amber-400 text-[11px]" />
              <span className="text-[11px] font-semibold text-amber-400">Sessão bloqueada</span>
            </div>
            <h1 id="lock-title" className="text-lg font-bold text-stone-100">
              Painel bloqueado por inatividade
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Informe sua senha para retomar o trabalho.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleUnlock} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                Senha
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  disabled={loading || attempts >= MAX_ATTEMPTS}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 pr-11 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition"
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
              {attempts > 0 && attempts < MAX_ATTEMPTS && (
                <p className="text-[10px] text-amber-500 mt-0.5">
                  {remaining} tentativa{remaining !== 1 ? 's' : ''} restante{remaining !== 1 ? 's' : ''} antes do logout automático.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!password.trim() || loading || attempts >= MAX_ATTEMPTS}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin text-xs" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-unlock text-xs" />
                  Desbloquear
                </span>
              )}
            </button>
          </form>

          {/* Opcao de logout */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => onLogout?.()}
              className="text-xs text-stone-600 hover:text-stone-400 transition underline underline-offset-2"
            >
              Sair e encerrar sessão
            </button>
          </div>

        </div>

        {/* Aviso de seguranca */}
        <p className="mt-4 text-center text-[10px] text-stone-700">
          Sessão protegida - Plantelligence
          <span className="mx-1.5">·</span>
          Conforme LGPD
        </p>
      </div>
    </div>
  );
};

export default LockScreen;
