/**
 * LoginPage — Fluxo multi-step inspirado em Google/Microsoft:
 *
 *  email          → digita o e-mail, valida existência
 *  password       → chip com e-mail, digita senha, link "Esqueci"
 *  mfa            → TOTP (primário) ou e-mail (alternativo)
 *  forgot_verify  → verifica identidade: TOTP ou código por e-mail
 *  forgot_code    → insere código recebido por e-mail
 *  forgot_new_pw  → nova senha + confirmação
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  checkEmailExists,
  login,
  initiateMfa,
  verifyMfa,
  verifyTotpForReset,
  requestPasswordReset,
  confirmPasswordReset,
} from '../api/authService.js';
import { useAuthStore } from '../store/authStore.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

const QRCodeComponent = QRCode?.default ?? QRCode;

// ── Decoração SVG de cogumelo ──────────────────────────────────────────────────
const MushroomDecor = () => (
  <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
    <ellipse cx="100" cy="95" rx="82" ry="58" fill="#7f1d1d" opacity="0.7" />
    <ellipse cx="100" cy="95" rx="82" ry="58" fill="url(#capGrad)" />
    <ellipse cx="100" cy="108" rx="75" ry="22" fill="#0d0000" opacity="0.5" />
    {[32,48,64,78,92,106,120,136,152,168].map((x, i) => (
      <line key={i} x1={x} y1="110" x2={x + (i < 5 ? -4 : 4)} y2="145" stroke="#ef4444" strokeWidth="1.2" opacity="0.25" />
    ))}
    <path d="M70 130 Q68 195 80 215 Q100 225 120 215 Q132 195 130 130 Q115 140 100 140 Q85 140 70 130Z" fill="#991b1b" opacity="0.6" />
    <path d="M75 130 Q74 190 83 210 Q100 218 117 210 Q126 190 125 130 Q113 138 100 138 Q87 138 75 130Z" fill="#b91c1c" opacity="0.4" />
    <ellipse cx="100" cy="148" rx="30" ry="6" fill="#7f1d1d" opacity="0.5" />
    <circle cx="62" cy="75" r="9" fill="white" opacity="0.18" />
    <circle cx="100" cy="60" r="12" fill="white" opacity="0.18" />
    <circle cx="138" cy="78" r="8" fill="white" opacity="0.18" />
    <circle cx="80" cy="88" r="6" fill="white" opacity="0.12" />
    <circle cx="122" cy="90" r="7" fill="white" opacity="0.12" />
    {[30,60,90,120,150,170].map((x) =>
      [230,245,255].map((y) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#ef4444" opacity="0.4" />
      ))
    )}
    <defs>
      <radialGradient id="capGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.5" />
      </radialGradient>
    </defs>
  </svg>
);

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

// ── Spinner inline ─────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
  </svg>
);

// ── Chip de e-mail (exibido nos steps após o e-mail) ──────────────────────────
const EmailChip = ({ email, onBack }) => (
  <button
    type="button"
    onClick={onBack}
    className="flex w-fit items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
  >
    <i className="fa-regular fa-circle-user text-slate-400" />
    {email}
    <i className="fa-solid fa-chevron-down text-[9px] text-slate-500" />
  </button>
);

// ── Botão principal ────────────────────────────────────────────────────────────
const PrimaryBtn = ({ children, disabled, loading: busy, onClick, type = 'submit' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || busy}
    className="w-full rounded-xl bg-gradient-to-r from-red-700 to-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition-all duration-200 hover:from-red-600 hover:to-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
  >
    {busy ? <span className="flex items-center justify-center gap-2"><Spinner />{typeof children === 'string' ? 'Aguarde...' : children}</span> : children}
  </button>
);

// ── Caixa de erro ──────────────────────────────────────────────────────────────
const ErrorBox = ({ msg }) =>
  msg ? (
    <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
      <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0 text-red-400" />
      {msg}
    </div>
  ) : null;

// ── Caixa de sucesso ───────────────────────────────────────────────────────────
const SuccessBox = ({ msg }) =>
  msg ? (
    <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
      <i className="fa-solid fa-circle-check mt-0.5 flex-shrink-0 text-emerald-400" />
      {msg}
    </div>
  ) : null;

// ── Validação de senha ─────────────────────────────────────────────────────────
const pwRules = [
  { test: (p) => p.length >= 8,         label: 'Mínimo 8 caracteres' },
  { test: (p) => /[A-Z]/.test(p),       label: 'Uma letra maiúscula' },
  { test: (p) => /[0-9]/.test(p),       label: 'Um número' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Um caractere especial' },
];

const PasswordStrength = ({ password }) => {
  const passed = pwRules.filter((r) => r.test(password)).length;
  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-400'];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passed ? colors[passed - 1] : 'bg-slate-700'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {pwRules.map((r) => (
          <p key={r.label} className={`flex items-center gap-1 text-[10px] transition-colors ${r.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
            <i className={`fa-solid ${r.test(password) ? 'fa-check' : 'fa-xmark'} text-[8px]`} />
            {r.label}
          </p>
        ))}
      </div>
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────

export const LoginPage = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate   = useNavigate();
  const location   = useLocation();
  // Detecta redirect do cliente apos SESSION_MAX_AGE_EXCEEDED
  const sessionExpired = new URLSearchParams(location.search).get('reason') === 'session_expired';
  const mfaRequiredForAction = new URLSearchParams(location.search).get('reason') === 'mfa_required_for_action';

  // ── Estado global do fluxo ───────────────────────────────────────────────────
  const [step, setStep]   = useState('email'); // email|password|mfa|forgot_verify|forgot_code|forgot_new_pw
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // password step
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // mfa
  const [mfaContext, setMfaContext]       = useState(null);
  const [mfaView, setMfaView]             = useState('primary'); // primary|alternative
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [methodDetails, setMethodDetails]   = useState(null);
  const [mfaCode, setMfaCode]             = useState('');
  const [initiatingMethod, setInitiatingMethod] = useState(false);

  // forgot password
  const [forgotView, setForgotView]         = useState('totp'); // totp|email
  const [forgotCode, setForgotCode]         = useState('');
  const [resetToken, setResetToken]         = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [successMsg, setSuccessMsg]         = useState(null);

  const clearError = () => setError(null);

  // ── Helpers MFA ──────────────────────────────────────────────────────────────
  const requestMfaForMethod = async (method, sidOverride) => {
    const sid = sidOverride ?? mfaContext?.sessionId;
    if (!sid) return;
    clearError();
    setInitiatingMethod(true);
    try {
      const res = await initiateMfa({ sessionId: sid, method });
      setMethodDetails(res);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível iniciar a verificação.', 'mfa'));
    } finally {
      setInitiatingMethod(false);
    }
  };

  const switchToAlternative = async () => {
    setMfaView('alternative');
    setSelectedMethod('email');
    setMethodDetails(null);
    setMfaCode('');
    await requestMfaForMethod('email');
  };

  const switchToPrimary = async () => {
    setMfaView('primary');
    setSelectedMethod('otp');
    setMethodDetails(null);
    setMfaCode('');
    await requestMfaForMethod('otp');
  };

  // ── STEP: email ──────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await checkEmailExists(email.trim());
      if (!res.exists) {
        setError('Não foi possível encontrar uma conta com este e-mail.');
        return;
      }
      setStep('password');
    } catch {
      setError('Não foi possível verificar o e-mail agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP: password ───────────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.mfaRequired) {
        setMfaContext(res);
        setStep('mfa');
        setMfaView('primary');
        setSelectedMethod('otp');
        setMfaCode('');
        await requestMfaForMethod('otp', res.sessionId);
        return;
      }
      if (res.user && res.tokens) {
        setSession({ user: res.user, tokens: res.tokens, requiresPasswordReset: res.passwordExpired });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Senha incorreta ou conta bloqueada.', 'login'));
    } finally {
      setLoading(false);
    }
  };

  // ── STEP: mfa verify ─────────────────────────────────────────────────────────
  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    if (!mfaContext?.sessionId) { setError('Sessão expirada. Faça login novamente.'); return; }
    if (mfaCode.length !== 6) { setError('Informe o código de 6 dígitos.'); return; }
    clearError();
    setLoading(true);
    try {
      const payload = { sessionId: mfaContext.sessionId, method: selectedMethod ?? 'otp', code: mfaCode };
      if (selectedMethod === 'otp' && methodDetails?.enrollmentId) payload.otpEnrollmentId = methodDetails.enrollmentId;
      const result = await verifyMfa(payload);
      setSession({ user: result.user, tokens: result.tokens, requiresPasswordReset: result.passwordExpired || mfaContext.passwordExpired });
      navigate('/dashboard');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Código inválido ou expirado.', 'mfa'));
    } finally {
      setLoading(false);
    }
  };

  // ── STEP: forgot_verify (TOTP) ───────────────────────────────────────────────
  const handleForgotTotp = async (e) => {
    e.preventDefault();
    if (forgotCode.length !== 6) { setError('Informe o código de 6 dígitos.'); return; }
    clearError();
    setLoading(true);
    try {
      const res = await verifyTotpForReset({ email, otpCode: forgotCode });
      setResetToken(res.resetToken);
      setForgotCode('');
      setStep('forgot_new_pw');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Código inválido ou expirado.', 'mfa'));
    } finally {
      setLoading(false);
    }
  };

  // ── STEP: forgot_verify (e-mail) → envia código ──────────────────────────────
  const handleSendEmailCode = async () => {
    clearError();
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      setForgotView('email_sent');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível enviar o código agora.'));
    } finally {
      setLoading(false);
    }
  };

  // ── STEP: forgot_code (valida token por e-mail) ──────────────────────────────
  const handleForgotEmailCode = (e) => {
    e.preventDefault();
    if (!forgotCode.trim()) { setError('Informe o código recebido.'); return; }
    setResetToken(forgotCode.trim());
    setForgotCode('');
    setStep('forgot_new_pw');
  };

  // ── STEP: forgot_new_pw ──────────────────────────────────────────────────────
  const handleNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    const allPass = pwRules.every((r) => r.test(newPassword));
    if (!allPass) { setError('A senha não atende aos requisitos mínimos.'); return; }
    clearError();
    setLoading(true);
    try {
      await confirmPasswordReset({ token: resetToken, newPassword });
      setSuccessMsg('Senha redefinida com sucesso! Faça login com a nova senha.');
      setTimeout(() => {
        setStep('email');
        setPassword(''); setNewPassword(''); setConfirmPassword('');
        setResetToken(''); setSuccessMsg(null);
      }, 2500);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível redefinir a senha. O código pode ter expirado.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Painel esquerdo (marca) ───────────────────────────────────────────────────
  const LeftPanel = (
    <div className="relative hidden overflow-hidden md:flex md:flex-col md:justify-center md:gap-12 md:p-10"
      style={{ background: 'linear-gradient(145deg, #1a0000 0%, #2d0a0a 40%, #0d0000 100%)' }}
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-red-700/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-red-900/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-56 opacity-25"><MushroomDecor /></div>
      <div className="pointer-events-none absolute -left-8 top-20 h-48 w-36 rotate-12 opacity-10"><MushroomDecor /></div>

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-800/50 bg-red-950/60 shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <ellipse cx="12" cy="10" rx="8" ry="6" fill="#ef4444" opacity="0.9" />
            <ellipse cx="12" cy="11" rx="7" ry="2" fill="#1a0000" opacity="0.5" />
            <rect x="9.5" y="13" width="5" height="7" rx="2" fill="#b91c1c" opacity="0.7" />
            <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.4" />
            <circle cx="14" cy="7" r="1" fill="white" opacity="0.3" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold tracking-wide text-red-50">PLANTELLIGENCE</h1>
        <p className="text-xs leading-relaxed text-red-200/50">Automação inteligente para<br />estufas de cogumelos.</p>
      </div>

      <div className="relative z-10 space-y-4">
        <p className="text-sm leading-relaxed text-slate-400/80">
          Console unificado de telemetria ambiental, segurança por MFA e rastreabilidade operacional em tempo real.
        </p>
        <div className="h-px w-10 bg-gradient-to-r from-red-600/60 to-transparent" />
        <div className="flex flex-wrap gap-2">
          {['Telemetria IoT', 'MFA obrigatório', 'Conformidade LGPD'].map((l) => (
            <span key={l} className="rounded-full border border-red-800/40 bg-red-950/40 px-3 py-1 text-[11px] text-red-200/60">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Cabeçalho do painel direito (volta) ───────────────────────────────────────
  const BackHeader = ({ label, subtitle, onBack }) => (
    <div className="flex items-center gap-3">
      {onBack && (
        <button type="button" onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
        >←</button>
      )}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500">{label}</p>
        <h2 className="text-xl font-semibold text-slate-50">{subtitle}</h2>
      </div>
    </div>
  );

  // ── Rodapé de termos ───────────────────────────────────────────────────────────
  const TermsFooter = (
    <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-3">
      <p className="text-center text-[11px] uppercase tracking-[0.16em] text-slate-500">Termos e privacidade</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {[['Termos de Uso', '/termos'], ['Política de Privacidade', '/privacidade'], ['Política de Cookies', '/cookies']].map(([l, to]) => (
          <Link key={l} to={to} className="rounded-full border border-slate-700/70 px-3 py-1.5 text-xs text-slate-300 transition hover:border-red-600/40 hover:text-red-300">{l}</Link>
        ))}
      </div>
    </div>
  );

  // ── Render por step ────────────────────────────────────────────────────────────
  const renderStep = () => {
    // ── E-MAIL ────────────────────────────────────────────────────────────────
    if (step === 'email') return (
      <>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500">Sistema de Automação</p>
          <h2 className="text-2xl font-semibold text-slate-50">Acesso ao console</h2>
          <p className="mt-1 text-sm text-slate-400">Continuar para Plantelligence</p>
        </div>

        <ErrorBox msg={error} />

        <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="seu@email.com"
              autoComplete="email"
              autoFocus
              required
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </label>
          <PrimaryBtn loading={loading}>Avançar</PrimaryBtn>
        </form>

        <p className="border-t border-slate-800/50 pt-4 text-center text-xs text-slate-600">
          Novo por aqui?{' '}
          <Link to="/register" className="text-red-500 transition hover:text-red-400">Solicitar cadastro</Link>
        </p>
        {TermsFooter}
      </>
    );

    // ── SENHA ─────────────────────────────────────────────────────────────────
    if (step === 'password') return (
      <>
        <BackHeader
          label="Sistema de Automação"
          subtitle="Insira sua senha"
          onBack={() => { setStep('email'); setPassword(''); clearError(); }}
        />

        <EmailChip email={email} onBack={() => { setStep('email'); setPassword(''); clearError(); }} />

        <ErrorBox msg={error} />

        <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Senha</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                placeholder="••••••••••••"
                autoComplete="current-password"
                autoFocus
                required
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 py-3 pl-4 pr-11 text-sm text-slate-100 placeholder:text-slate-600 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
              <button type="button"
                onMouseDown={() => setShowPassword(true)} onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)} onTouchStart={() => setShowPassword(true)} onTouchEnd={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-red-400" tabIndex={-1}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          <button type="button"
            onClick={() => { clearError(); setForgotView('totp'); setForgotCode(''); setStep('forgot_verify'); }}
            className="self-start text-xs text-slate-400 transition hover:text-red-400">
            Esqueceu a senha?
          </button>

          <PrimaryBtn loading={loading}>Avançar</PrimaryBtn>
        </form>
      </>
    );

    // ── MFA ───────────────────────────────────────────────────────────────────
    if (step === 'mfa') return (
      <>
        <BackHeader
          label="Verificação em duas etapas"
          subtitle="Autenticação MFA"
          onBack={() => { setStep('password'); setMfaContext(null); setMethodDetails(null); setMfaCode(''); clearError(); }}
        />

        <EmailChip email={email} onBack={() => { setStep('email'); clearError(); }} />

        <ErrorBox msg={error} />

        {mfaView === 'primary' && (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-600/15 text-red-400">
                <i className="fa-solid fa-mobile-screen-button text-base" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Aplicativo autenticador</p>
                <p className="text-xs text-slate-400">
                  {initiatingMethod ? 'Carregando...'
                    : methodDetails?.configured === false ? 'Configure o autenticador com o QR Code abaixo.'
                    : 'Use o código atual exibido no app autenticador.'}
                </p>
              </div>
            </div>

            {methodDetails?.configured === false && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-center text-xs text-slate-400">Escaneie o QR Code para adicionar ao autenticador.</p>
                  {methodDetails.uri && (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-950 p-3">
                      <QRCodeComponent value={methodDetails.uri} size={136} bgColor="#030712" fgColor="#ef4444" />
                    </div>
                  )}
                  <p className="text-center text-xs text-slate-500">{methodDetails.accountName} · {methodDetails.issuer}</p>
                  <p className="break-all rounded-lg bg-slate-950 px-3 py-2 font-mono text-sm tracking-widest text-red-400">{methodDetails.secret}</p>
                </div>
              </div>
            )}

            <form className="flex flex-col gap-3" onSubmit={handleVerifyMfa}>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Código de verificação</span>
                <input placeholder="000000" value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric" autoComplete="one-time-code" maxLength={6} disabled={initiatingMethod}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-slate-100 placeholder:text-slate-600 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:opacity-40"
                />
              </label>
              <PrimaryBtn loading={loading} disabled={initiatingMethod || !methodDetails || mfaCode.length !== 6}>
                Entrar no dashboard
              </PrimaryBtn>
            </form>

            <div className="border-t border-slate-800/50 pt-3 text-center">
              <button type="button" onClick={switchToAlternative} disabled={loading || initiatingMethod}
                className="text-xs text-slate-400 transition hover:text-red-400 disabled:opacity-40">
                Entrar de outra maneira
              </button>
            </div>
          </>
        )}

        {mfaView === 'alternative' && (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
                <i className="fa-solid fa-envelope text-base" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Código por e-mail</p>
                <p className="text-xs text-slate-400">
                  {initiatingMethod ? 'Enviando código...'
                    : methodDetails ? <><strong className="text-slate-200">{email}</strong>: verifique sua caixa de entrada.</>
                    : 'Código de 6 dígitos enviado para o e-mail cadastrado.'}
                </p>
                {methodDetails?.expiresAt && (
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Expira às {new Date(methodDetails.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            <form className="flex flex-col gap-3" onSubmit={handleVerifyMfa}>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Código de verificação</span>
                <input placeholder="000000" value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric" autoComplete="one-time-code" maxLength={6} disabled={initiatingMethod}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-slate-100 placeholder:text-slate-600 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:opacity-40"
                />
              </label>
              <PrimaryBtn loading={loading} disabled={initiatingMethod || !methodDetails || mfaCode.length !== 6}>
                Entrar no dashboard
              </PrimaryBtn>
            </form>

            <div className="flex items-center justify-between border-t border-slate-800/50 pt-3">
              <button type="button" onClick={() => requestMfaForMethod('email')} disabled={loading || initiatingMethod}
                className="text-xs text-red-500 transition hover:text-red-400 disabled:opacity-40">
                Reenviar código
              </button>
              <button type="button" onClick={switchToPrimary} disabled={loading || initiatingMethod}
                className="text-xs text-slate-400 transition hover:text-slate-200 disabled:opacity-40">
                ← Usar autenticador
              </button>
            </div>
          </>
        )}
      </>
    );

    // ── ESQUECI SENHA — verificar identidade ──────────────────────────────────
    if (step === 'forgot_verify') return (
      <>
        <BackHeader
          label="Recuperação de acesso"
          subtitle="Verificar sua identidade"
          onBack={() => { setStep('password'); setForgotCode(''); clearError(); }}
        />

        <EmailChip email={email} onBack={() => { setStep('email'); clearError(); }} />

        <p className="text-sm text-slate-400">Como deseja verificar sua identidade?</p>

        <ErrorBox msg={error} />

        {/* Seleção de método */}
        <div className="flex flex-col gap-2">
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${forgotView === 'totp' ? 'border-red-500/60 bg-red-500/8' : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600'}`}>
            <input type="radio" name="forgot-method" checked={forgotView === 'totp'} onChange={() => { setForgotView('totp'); setForgotCode(''); clearError(); }}
              className="h-4 w-4 accent-red-500" />
            <div>
              <p className={`text-sm font-semibold ${forgotView === 'totp' ? 'text-slate-100' : 'text-slate-300'}`}>Aplicativo autenticador</p>
              <p className="text-xs text-slate-500">Use o código atual do seu app autenticador</p>
            </div>
          </label>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${forgotView === 'email' || forgotView === 'email_sent' ? 'border-red-500/60 bg-red-500/8' : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600'}`}>
            <input type="radio" name="forgot-method" checked={forgotView === 'email' || forgotView === 'email_sent'} onChange={() => { setForgotView('email'); setForgotCode(''); clearError(); }}
              className="h-4 w-4 accent-red-500" />
            <div>
              <p className={`text-sm font-semibold ${forgotView === 'email' || forgotView === 'email_sent' ? 'text-slate-100' : 'text-slate-300'}`}>Código por e-mail</p>
              <p className="text-xs text-slate-500">Enviaremos um código para {email}</p>
            </div>
          </label>
        </div>

        {/* TOTP: campo de código */}
        {forgotView === 'totp' && (
          <form className="flex flex-col gap-3" onSubmit={handleForgotTotp}>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Código do autenticador</span>
              <input placeholder="000000" value={forgotCode}
                onChange={(e) => { setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); }}
                inputMode="numeric" maxLength={6} autoFocus
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-slate-100 placeholder:text-slate-600 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </label>
            <PrimaryBtn loading={loading} disabled={forgotCode.length !== 6}>Verificar e continuar</PrimaryBtn>
          </form>
        )}

        {/* E-mail: botão de enviar */}
        {forgotView === 'email' && (
          <PrimaryBtn loading={loading} type="button" onClick={handleSendEmailCode}>
            Enviar código por e-mail
          </PrimaryBtn>
        )}

        {/* E-mail: código enviado → campo */}
        {forgotView === 'email_sent' && (
          <>
            <div className="flex items-start gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-300">
              <i className="fa-solid fa-envelope-open-text mt-0.5 flex-shrink-0" />
              Código enviado para <strong className="ml-1">{email}</strong>. Verifique sua caixa de entrada.
            </div>
            <form className="flex flex-col gap-3" onSubmit={handleForgotEmailCode}>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Código recebido</span>
                <input placeholder="Cole ou digite o token recebido" value={forgotCode}
                  onChange={(e) => { setForgotCode(e.target.value); clearError(); }}
                  autoFocus
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-center font-mono text-sm tracking-widest text-slate-100 placeholder:text-slate-600 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                />
              </label>
              <PrimaryBtn loading={loading} disabled={!forgotCode.trim()}>Continuar</PrimaryBtn>
            </form>
            <div className="text-center">
              <button type="button" onClick={handleSendEmailCode} disabled={loading}
                className="text-xs text-slate-400 transition hover:text-red-400">
                Reenviar código
              </button>
            </div>
          </>
        )}
      </>
    );

    // ── NOVA SENHA ────────────────────────────────────────────────────────────
    if (step === 'forgot_new_pw') return (
      <>
        <BackHeader
          label="Recuperação de acesso"
          subtitle="Criar nova senha"
        />

        <EmailChip email={email} onBack={() => { setStep('email'); clearError(); }} />

        <ErrorBox msg={error} />
        <SuccessBox msg={successMsg} />

        {!successMsg && (
          <form className="flex flex-col gap-4" onSubmit={handleNewPassword}>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Nova senha</span>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
                  placeholder="••••••••••••" autoFocus required
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 py-3 pl-4 pr-11 text-sm text-slate-100 placeholder:text-slate-600 transition-all focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                />
                <button type="button" onMouseDown={() => setShowNew(true)} onMouseUp={() => setShowNew(false)}
                  onMouseLeave={() => setShowNew(false)} onTouchStart={() => setShowNew(true)} onTouchEnd={() => setShowNew(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400" tabIndex={-1}>
                  <EyeIcon open={showNew} />
                </button>
              </div>
              {newPassword && <PasswordStrength password={newPassword} />}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Confirmar senha</span>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                  placeholder="••••••••••••" required
                  className={`w-full rounded-xl border py-3 pl-4 pr-11 text-sm text-slate-100 placeholder:text-slate-600 bg-slate-800/50 transition-all focus:outline-none focus:ring-2 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-700/60 focus:border-red-600/60 focus:ring-red-600/20'
                  }`}
                />
                <button type="button" onMouseDown={() => setShowConfirm(true)} onMouseUp={() => setShowConfirm(false)}
                  onMouseLeave={() => setShowConfirm(false)} onTouchStart={() => setShowConfirm(true)} onTouchEnd={() => setShowConfirm(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400" tabIndex={-1}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[10px] text-rose-400"><i className="fa-solid fa-xmark mr-1" />As senhas não coincidem</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-[10px] text-emerald-400"><i className="fa-solid fa-check mr-1" />Senhas coincidem</p>
              )}
            </label>

            <PrimaryBtn loading={loading} disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}>
              Redefinir senha
            </PrimaryBtn>
          </form>
        )}
      </>
    );

    return null;
  };

  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] ring-1 ring-red-900/20 md:grid md:grid-cols-[1fr_1.15fr]">
      {LeftPanel}
      <div className="flex flex-col justify-center gap-5 bg-[#171112]/96 p-8 md:p-10 min-h-[520px]">
        {renderStep()}
      </div>
    </div>
  );
};
