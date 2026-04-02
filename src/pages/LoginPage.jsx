// Página de login — lida com autenticação normal e verificação de MFA (TOTP/QR Code).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { login, initiateMfa, verifyMfa } from '../api/authService.js';
import { useAuthStore } from '../store/authStore.js';

const initialState = { email: '', password: '' };

/* ── Decoração SVG de cogumelo ── */
const MushroomDecor = () => (
  <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
    {/* Chapéu */}
    <ellipse cx="100" cy="95" rx="82" ry="58" fill="#7f1d1d" opacity="0.7" />
    <ellipse cx="100" cy="95" rx="82" ry="58" fill="url(#capGrad)" />
    {/* Sombra do chapéu */}
    <ellipse cx="100" cy="108" rx="75" ry="22" fill="#0d0000" opacity="0.5" />
    {/* Linhas das lamelas */}
    {[32,48,64,78,92,106,120,136,152,168].map((x, i) => (
      <line key={i} x1={x} y1="110" x2={x + (i < 5 ? -4 : 4)} y2="145" stroke="#ef4444" strokeWidth="1.2" opacity="0.25" />
    ))}
    {/* Caule */}
    <path d="M70 130 Q68 195 80 215 Q100 225 120 215 Q132 195 130 130 Q115 140 100 140 Q85 140 70 130Z" fill="#991b1b" opacity="0.6" />
    <path d="M75 130 Q74 190 83 210 Q100 218 117 210 Q126 190 125 130 Q113 138 100 138 Q87 138 75 130Z" fill="#b91c1c" opacity="0.4" />
    {/* Anel (saia) */}
    <ellipse cx="100" cy="148" rx="30" ry="6" fill="#7f1d1d" opacity="0.5" />
    {/* Pintas brancas */}
    <circle cx="62" cy="75" r="9" fill="white" opacity="0.18" />
    <circle cx="100" cy="60" r="12" fill="white" opacity="0.18" />
    <circle cx="138" cy="78" r="8" fill="white" opacity="0.18" />
    <circle cx="80" cy="88" r="6" fill="white" opacity="0.12" />
    <circle cx="122" cy="90" r="7" fill="white" opacity="0.12" />
    {/* Pontos de esporos */}
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

/* ── Ícone de exibir/ocultar senha ── */
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

/* ── Cartão de método MFA ── */
const MfaCard = ({ value, selected, disabled, onChange, title, description }) => (
  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-all duration-200 ${selected ? 'border-red-500/70 bg-red-500/10' : 'border-slate-700/60 bg-slate-800/30 hover:border-red-600/50 hover:bg-slate-800/60'}`}>
    <input type="radio" name="mfa-method" value={value} checked={selected} onChange={onChange} disabled={disabled} className="mt-0.5 h-4 w-4 accent-red-500" />
    <span className="flex flex-col gap-0.5">
      <span className={`font-semibold ${selected ? 'text-red-100' : 'text-slate-200'}`}>{title}</span>
      <span className="text-xs text-slate-400">{description}</span>
    </span>
  </label>
);

export const LoginPage = () => {
  const [form, setForm] = useState(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [mfaError, setMfaError] = useState(null);
  const [mfaInfo, setMfaInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initiatingMethod, setInitiatingMethod] = useState(false);
  const [step, setStep] = useState('credentials');
  const [mfaContext, setMfaContext] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [methodDetails, setMethodDetails] = useState(null);
  const [code, setCode] = useState('');
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setMfaError(null); setMfaInfo(null);
    setLoading(true);
    try {
      const response = await login(form);
      if (response.mfaRequired) {
        setMfaContext(response);
        setStep('mfa');
        setSelectedMethod(null); setMethodDetails(null); setCode('');
        setMfaInfo('Escolha o canal de verificação MFA para acessar o console da estufa.');
        return;
      }
      if (response.user && response.tokens) {
        setSession({ user: response.user, tokens: response.tokens, requiresPasswordReset: response.passwordExpired });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Falha no login.');
    } finally {
      setLoading(false);
    }
  };

  const requestMfaForMethod = async (method) => {
    if (!mfaContext?.sessionId) return;
    setMfaError(null); setMfaInfo(null);
    setInitiatingMethod(true);
    try {
      const response = await initiateMfa({ sessionId: mfaContext.sessionId, method });
      setMethodDetails(response);
      if (method === 'email') {
        setMfaInfo('Enviamos um código de verificação para o seu e-mail.');
      } else if (response.configured) {
        setMfaInfo('Informe o código exibido no seu aplicativo autenticador.');
      } else {
        setMfaInfo('Escaneie o QR Code ou utilize a chave para configurar seu autenticador. Depois informe o primeiro código gerado.');
      }
    } catch (err) {
      setMethodDetails(null);
      setMfaError(err.response?.data?.message ?? 'Não foi possível iniciar o método escolhido.');
    } finally {
      setInitiatingMethod(false);
    }
  };

  const handleSelectMethod = async (method) => {
    if (!method) return;
    setSelectedMethod(method); setMethodDetails(null); setCode('');
    await requestMfaForMethod(method);
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    if (!mfaContext?.sessionId) { setMfaError('Sessão expirada. Faça login novamente.'); return; }
    if (!selectedMethod) { setMfaError('Escolha um método de verificação.'); return; }
    if (code.trim().length !== 6) { setMfaError('Informe o código de 6 dígitos.'); return; }
    setMfaError(null);
    setLoading(true);
    try {
      const payload = { sessionId: mfaContext.sessionId, method: selectedMethod, code: code.trim() };
      if (selectedMethod === 'otp' && methodDetails?.enrollmentId) payload.otpEnrollmentId = methodDetails.enrollmentId;
      const result = await verifyMfa(payload);
      setSession({ user: result.user, tokens: result.tokens, requiresPasswordReset: result.passwordExpired || mfaContext.passwordExpired });
      setMfaContext(null); setSelectedMethod(null); setMethodDetails(null); setCode(''); setMfaInfo(null); setStep('credentials');
      navigate('/dashboard');
    } catch (err) {
      setMfaError(err.response?.data?.message ?? 'Falha na validação do código informado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!selectedMethod) { setMfaError('Selecione primeiro o método desejado.'); return; }
    setCode('');
    await requestMfaForMethod(selectedMethod);
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setMfaContext(null); setSelectedMethod(null); setMethodDetails(null);
    setCode(''); setMfaError(null); setMfaInfo(null);
  };

  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] ring-1 ring-red-900/20 md:grid md:grid-cols-[1fr_1.15fr]">

      {/* ── Lado esquerdo: painel da marca ── */}
      <div className="relative hidden overflow-hidden md:flex md:flex-col md:justify-between md:p-10"
        style={{ background: 'linear-gradient(145deg, #1a0000 0%, #2d0a0a 40%, #0d0000 100%)' }}
      >
        {/* Esferas de brilho */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-red-700/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-red-900/15 blur-3xl" />

        {/* Grade de esporos */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        {/* Ilustração de cogumelo */}
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-56 opacity-25">
          <MushroomDecor />
        </div>
        <div className="pointer-events-none absolute -left-8 top-20 h-48 w-36 rotate-12 opacity-10">
          <MushroomDecor />
        </div>

        {/* Marca */}
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
          <h1 className="text-xl font-semibold tracking-wide text-red-50">Plantelligence</h1>
          <p className="text-xs leading-relaxed text-red-200/50">
            Automação inteligente para<br />estufas de cogumelos.
          </p>
        </div>

        {/* Bloco central */}
        <div className="relative z-10 space-y-4">
          <p className="text-sm leading-relaxed text-slate-400/80">
            Console unificado de telemetria ambiental, segurança por MFA e rastreabilidade operacional em tempo real.
          </p>
          <div className="h-px w-10 bg-gradient-to-r from-red-600/60 to-transparent" />
          <div className="flex flex-wrap gap-2">
            {['Telemetria IoT', 'MFA obrigatório', 'Conformidade LGPD'].map((label) => (
              <span key={label} className="rounded-full border border-red-800/40 bg-red-950/40 px-3 py-1 text-[11px] text-red-200/60">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Rodapé visual */}
        <p className="relative z-10 text-[10px] tracking-widest text-red-300/70">BIOME 1.4 · V2.1.0</p>
      </div>

      {/* ── Lado direito: painel do formulário ── */}
      <div className="flex flex-col justify-center gap-5 bg-[#171112]/96 p-8 md:p-10">

        {step === 'credentials' ? (
          <>
            {/* Cabeçalho */}
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500">Sistema de Automação</p>
              <h2 className="text-2xl font-semibold text-slate-50">Acesso ao console</h2>
            </div>

            {/* Erro */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Formulário */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* E-mail */}
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Usuário</span>
                <input
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 backdrop-blur-sm transition-all duration-150 focus:border-red-600/60 focus:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                />
              </label>

              {/* Senha + mostrar/ocultar */}
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Senha</span>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 py-3 pl-4 pr-11 text-sm text-slate-100 placeholder:text-slate-600 backdrop-blur-sm transition-all duration-150 focus:border-red-600/60 focus:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-red-400"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </label>

              {/* Esqueci a senha */}
              <div className="flex justify-end">
                <Link to="/password-reset" className="text-xs text-slate-500 transition hover:text-red-400">
                  Esqueci a senha
                </Link>
              </div>

              {/* Enviar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-red-700 to-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition-all duration-200 hover:from-red-600 hover:to-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
                    </svg>
                    Validando...
                  </span>
                ) : 'ENTRAR'}
              </button>
            </form>

            {/* Link de cadastro */}
            <p className="border-t border-slate-800/50 pt-4 text-center text-xs text-slate-600">
              Novo por aqui?{' '}
              <Link to="/register" className="text-red-500 transition hover:text-red-400">
                Solicitar cadastro
              </Link>
            </p>

          </>
        ) : (
          <>
            {/* Etapa de MFA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToCredentials}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
              >
                ←
              </button>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500">Verificação em duas etapas</p>
                <h2 className="text-xl font-semibold text-slate-50">Autenticação MFA</h2>
              </div>
            </div>

            {mfaError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {mfaError}
              </div>
            )}
            {mfaInfo && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-sm text-red-200/80">
                {mfaInfo}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <MfaCard
                value="email"
                selected={selectedMethod === 'email'}
                onChange={() => handleSelectMethod('email')}
                disabled={initiatingMethod || loading}
                title="Código por e-mail"
                description="Código de 6 dígitos enviado para o e-mail cadastrado."
              />
              <MfaCard
                value="otp"
                selected={selectedMethod === 'otp'}
                onChange={() => handleSelectMethod('otp')}
                disabled={initiatingMethod || loading}
                title="Aplicativo autenticador"
                description={mfaContext?.methods?.otp?.enrollmentRequired ? 'QR Code exibido para configuração inicial.' : 'Use o código atual do app.'}
              />
            </div>

            {selectedMethod && methodDetails && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 text-sm text-slate-300">
                {selectedMethod === 'email' ? (
                  <>
                    <p>Código enviado para <strong className="text-slate-100">{form.email}</strong>.</p>
                    {methodDetails.expiresAt && <p className="mt-1 text-xs text-slate-500">Expira às {new Date(methodDetails.expiresAt).toLocaleTimeString()}.</p>}
                  </>
                ) : methodDetails.configured ? (
                  <>
                    <p>Use o código atual para <strong className="text-slate-100">{methodDetails.accountName ?? form.email}</strong>.</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-center text-xs text-slate-400">Escaneie o QR Code para adicionar ao autenticador.</p>
                    {methodDetails.uri && (
                      <div className="rounded-xl border border-slate-700/50 bg-slate-950 p-3">
                        <QRCode value={methodDetails.uri} size={136} bgColor="#030712" fgColor="#ef4444" />
                      </div>
                    )}
                    <p className="text-center text-xs text-slate-500">{methodDetails.accountName} · {methodDetails.issuer}</p>
                    <p className="break-all rounded-lg bg-slate-950 px-3 py-2 font-mono text-sm tracking-widest text-red-400">{methodDetails.secret}</p>
                  </div>
                )}
              </div>
            )}

            <form className="flex flex-col gap-3" onSubmit={handleVerifyMfa}>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Código de verificação</span>
                <input
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  disabled={!selectedMethod || initiatingMethod}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-slate-100 placeholder:text-slate-600 transition-all duration-150 focus:border-red-600/60 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:opacity-40"
                />
              </label>

              <button
                type="submit"
                disabled={loading || initiatingMethod || !selectedMethod || !methodDetails || code.length !== 6}
                className="w-full rounded-xl bg-gradient-to-r from-red-700 to-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition-all duration-200 hover:from-red-600 hover:to-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Validando MFA...' : 'Entrar no dashboard'}
              </button>
            </form>

            <div className="flex justify-end border-t border-slate-800/50 pt-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || initiatingMethod || !selectedMethod}
                className="text-xs text-red-500 transition hover:text-red-400 disabled:text-slate-600"
              >
                Reenviar código
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
