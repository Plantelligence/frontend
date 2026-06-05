/**
 * PasswordResetPage — Rota de fallback para quem clicou no link do e-mail
 * (/password-reset?token=xxx) ou acessa a redefinição de senha diretamente.
 *
 * Fluxo: token na URL → direto para nova senha | sem token → pede o e-mail.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, requestPasswordReset } from '../api/authService.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';
import { useEmailCooldown } from '../hooks/useEmailCooldown.js';

// ── Ícone olho ─────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }) =>
  open ? (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.19C18.268 5.943 14.478 3 10 3a9.958 9.958 0 0 0-4.512 1.074L3.28 2.22Zm4.261 4.26 1.514 1.515a2.003 2.003 0 0 1 2.45 2.45l1.514 1.514a4 4 0 0 0-5.478-5.478Z" clipRule="evenodd" />
      <path d="M12.454 16.697 9.75 13.992a4 4 0 0 1-3.742-3.741L2.335 6.578A9.98 9.98 0 0 0 .458 10c1.274 4.057 5.064 7 9.542 7 .827 0 1.63-.105 2.454-.303Z" />
    </svg>
  );

// ── Validação de senha ─────────────────────────────────────────────────────────
const pwRules = [
  { test: (p) => p.length >= 8,           label: 'Mínimo 8 caracteres' },
  { test: (p) => /[A-Z]/.test(p),         label: 'Uma letra maiúscula' },
  { test: (p) => /[0-9]/.test(p),         label: 'Um número' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Um caractere especial' },
];

const PasswordStrength = ({ password }) => {
  const passed = pwRules.filter((r) => r.test(password)).length;
  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-400'];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < passed ? colors[passed - 1] : 'bg-slate-700'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {pwRules.map((r) => (
          <p key={r.label} className={`flex items-center gap-1 text-[10px] ${r.test(password) ? 'text-emerald-400' : 'text-slate-500 dark:text-stone-400'}`}>
            <i className={`fa-solid ${r.test(password) ? 'fa-check' : 'fa-xmark'} text-[8px]`} />
            {r.label}
          </p>
        ))}
      </div>
    </div>
  );
};

export const PasswordResetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlToken = searchParams.get('token') ?? '';

  // step: 'request' | 'confirm' | 'done'
  const [step, setStep]             = useState(urlToken ? 'confirm' : 'request');
  const [email, setEmail]           = useState('');
  const [token, setToken]           = useState(urlToken);
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [info, setInfo]             = useState(null);

  const { canSend, secondsLeft, recordSend } = useEmailCooldown();

  // Se chegou com token na URL, pula direto para redefinir
  useEffect(() => {
    if (urlToken) { setToken(urlToken); setStep('confirm'); }
  }, [urlToken]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    setError(null); setInfo(null);
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      recordSend();
      setInfo('Se o e-mail estiver cadastrado, você receberá o código em instantes. Verifique também o spam.');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível processar sua solicitação agora.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPw) { setError('As senhas não coincidem.'); return; }
    if (!pwRules.every((r) => r.test(newPassword))) { setError('A senha não atende aos requisitos mínimos.'); return; }
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset({ token, newPassword });
      setStep('done');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Código inválido ou expirado. Solicite um novo.'));
    } finally {
      setLoading(false);
    }
  };

  const cardClass = 'mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-[#171112] p-8 shadow-2xl';

  // ── Logo ──────────────────────────────────────────────────────────────────────
  const Logo = (
    <div className="mb-6 flex flex-col items-center gap-2">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-800/50 bg-red-950/60">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <ellipse cx="12" cy="10" rx="8" ry="6" fill="#ef4444" opacity="0.9" />
          <ellipse cx="12" cy="11" rx="7" ry="2" fill="#1a0000" opacity="0.5" />
          <rect x="9.5" y="13" width="5" height="7" rx="2" fill="#b91c1c" opacity="0.7" />
          <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.4" />
          <circle cx="14" cy="7" r="1" fill="white" opacity="0.3" />
        </svg>
      </div>
      <span className="text-sm font-semibold tracking-widest text-red-200/70">PLANTELLIGENCE</span>
    </div>
  );

  // ── STEP: request ─────────────────────────────────────────────────────────────
  if (step === 'request') return (
    <div className={cardClass}>
      {Logo}
      <h1 className="mb-1 text-xl font-semibold text-slate-50">Recuperar acesso</h1>
      <p className="mb-6 text-sm text-slate-400 dark:text-stone-500">
        Informe o e-mail cadastrado. Enviaremos um código para redefinição de senha.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />{error}
        </div>
      )}
      {info && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-300">
          <i className="fa-solid fa-envelope-open-text mt-0.5 flex-shrink-0" />{info}
        </div>
      )}

      <form onSubmit={handleRequest} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-stone-400">E-mail cadastrado</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com" autoFocus required
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 dark:text-stone-400 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20"
          />
        </label>
        <button type="submit" disabled={loading || !canSend}
          className="w-full rounded-xl bg-gradient-to-r from-red-700 to-red-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-red-600 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-40">
          {loading ? 'Enviando...' : !canSend ? `Aguarde ${secondsLeft}s` : 'Enviar código de recuperação'}
        </button>
      </form>

      {info && (
        <button type="button" onClick={() => setStep('confirm')}
          className="mt-4 w-full rounded-xl border border-slate-700/60 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-slate-100">
          Já tenho o código → Inserir agora
        </button>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-800/50 pt-4">
        <Link to="/login" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-stone-400 transition hover:text-red-400">
          <i className="fa-solid fa-arrow-left text-[10px]" />Voltar ao login
        </Link>
      </div>
    </div>
  );

  // ── STEP: confirm (token + nova senha) ────────────────────────────────────────
  if (step === 'confirm') return (
    <div className={cardClass}>
      {Logo}
      <h1 className="mb-1 text-xl font-semibold text-slate-50">Criar nova senha</h1>
      <p className="mb-6 text-sm text-slate-400 dark:text-stone-500">
        Insira o código recebido por e-mail e defina uma nova senha segura.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleConfirm} className="flex flex-col gap-4">
        {!urlToken && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-stone-400">Código recebido</span>
            <input value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="Cole o código do e-mail" autoFocus required
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 dark:text-stone-400 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-stone-400">Nova senha</span>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
              placeholder="••••••••••••" required
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 py-3 pl-4 pr-11 text-sm text-slate-100 placeholder:text-slate-600 dark:text-stone-400 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
            <button type="button" onMouseDown={() => setShowNew(true)} onMouseUp={() => setShowNew(false)}
              onMouseLeave={() => setShowNew(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-stone-400 hover:text-red-400" tabIndex={-1}>
              <EyeIcon open={showNew} />
            </button>
          </div>
          {newPassword && <PasswordStrength password={newPassword} />}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-stone-400">Confirmar senha</span>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setError(null); }}
              placeholder="••••••••••••" required
              className={`w-full rounded-xl border py-3 pl-4 pr-11 text-sm text-slate-100 placeholder:text-slate-600 dark:text-stone-400 bg-slate-800/50 transition-all focus:outline-none focus:ring-2 ${
                confirmPw && confirmPw !== newPassword
                  ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-700/60 focus:border-red-600/60 focus:ring-red-600/20'
              }`}
            />
            <button type="button" onMouseDown={() => setShowConfirm(true)} onMouseUp={() => setShowConfirm(false)}
              onMouseLeave={() => setShowConfirm(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-stone-400 hover:text-red-400" tabIndex={-1}>
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {confirmPw && confirmPw !== newPassword && (
            <p className="text-[10px] text-rose-400"><i className="fa-solid fa-xmark mr-1" />As senhas não coincidem</p>
          )}
          {confirmPw && confirmPw === newPassword && (
            <p className="text-[10px] text-emerald-400"><i className="fa-solid fa-check mr-1" />Senhas coincidem</p>
          )}
        </label>

        <button type="submit" disabled={loading || !token || !newPassword || newPassword !== confirmPw}
          className="w-full rounded-xl bg-gradient-to-r from-red-700 to-red-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-red-600 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-40">
          {loading ? 'Redefinindo...' : 'Redefinir senha'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-4">
        <button type="button" onClick={() => setStep('request')}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-stone-400 transition hover:text-red-400">
          <i className="fa-solid fa-arrow-left text-[10px]" />Solicitar novo código
        </button>
      </div>
    </div>
  );

  // ── STEP: done ────────────────────────────────────────────────────────────────
  return (
    <div className={cardClass}>
      {Logo}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <i className="fa-solid fa-check text-3xl" />
        </div>
        <h1 className="text-xl font-semibold text-slate-50">Senha redefinida!</h1>
        <p className="text-sm text-slate-400 dark:text-stone-500">
          Sua nova senha foi salva com sucesso. Você já pode acessar o console.
        </p>
        <button type="button" onClick={() => navigate('/login')}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-red-700 to-red-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-red-600 hover:to-red-500">
          Ir para o login
        </button>
      </div>
    </div>
  );
};
