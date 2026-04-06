import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { InputField } from '../components/InputField.jsx';
import { Button } from '../components/Button.jsx';
import { completeFirstAccess, startFirstAccess } from '../api/authService.js';
import { isPasswordCompliant, passwordPattern, passwordPolicy } from '../utils/passwordPolicy.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

const QRCodeComponent = QRCode?.default ?? QRCode;

export const FirstAccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = (searchParams.get('token') || '').trim();

  const [loadingStart, setLoadingStart] = useState(true);
  const [startError, setStartError] = useState(null);
  const [setup, setSetup] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const formattedExpiry = useMemo(() => {
    const value = setup?.tokenExpiresAt;
    if (!value) {
      return null;
    }

    try {
      return new Date(value).toLocaleString('pt-BR');
    } catch {
      return value;
    }
  }, [setup]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoadingStart(true);
      setStartError(null);
      setSetup(null);

      if (!token) {
        setStartError('Link de primeiro acesso inválido. Solicite um novo convite ao administrador.');
        setLoadingStart(false);
        return;
      }

      try {
        const result = await startFirstAccess({ token });
        if (!active) {
          return;
        }
        setSetup(result);
      } catch (error) {
        if (active) {
          setStartError(getFriendlyErrorMessage(error, 'Não foi possível validar seu convite de primeiro acesso.'));
        }
      } finally {
        if (active) {
          setLoadingStart(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!submitSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [submitSuccess, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!setup?.enrollment?.enrollmentId) {
      setSubmitError('Configuração de autenticação expirada. Reabra o link do convite.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('As senhas precisam coincidir.');
      return;
    }

    if (!isPasswordCompliant(newPassword)) {
      setSubmitError(passwordPolicy.message);
      return;
    }

    if (otpCode.trim().length !== 6) {
      setSubmitError('Informe o código de 6 dígitos do aplicativo autenticador.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await completeFirstAccess({
        token,
        enrollmentId: setup.enrollment.enrollmentId,
        newPassword,
        otpCode: otpCode.trim()
      });
      setSubmitSuccess(result.message || 'Primeiro acesso concluído com sucesso.');
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
    } catch (error) {
      setSubmitError(getFriendlyErrorMessage(error, 'Não foi possível concluir o primeiro acesso.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-2xl border border-stone-700 bg-[#171112] p-8 shadow-xl">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">Primeiro acesso</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">Ative sua conta no PLANTELLIGENCE</h1>
        <p className="mt-2 text-sm text-slate-400">
          Siga os passos abaixo para criar sua senha e configurar a verificação de segurança.
        </p>
      </header>

      {loadingStart && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
          Validando seu link de convite...
        </div>
      )}

      {startError && (
        <div className="rounded-lg border border-rose-500/60 bg-rose-500/10 p-4 text-sm text-rose-200">
          {startError}
        </div>
      )}

      {!loadingStart && !startError && setup && (
        <>
          <section className="grid gap-4 rounded-xl border border-slate-700/60 bg-slate-900/30 p-5 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-red-300">Passo 1</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-100">Instale o aplicativo autenticador</h2>
              <p className="mt-2 text-sm text-slate-300">
                Recomendamos o <strong>Microsoft Authenticator</strong>.
                Se preferir, você também pode usar Google Authenticator, Authy ou outro aplicativo compatível.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Conta: <strong className="text-slate-200">{setup.user?.email}</strong>
              </p>
              {formattedExpiry && (
                <p className="mt-1 text-xs text-slate-500">Link válido até {formattedExpiry}.</p>
              )}
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-300">
              <p className="font-semibold text-slate-100">Orientação rápida</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-400">
                <li>Abra o aplicativo autenticador no celular.</li>
                <li>Toque em adicionar conta por QR Code.</li>
                <li>No passo 2, escaneie o QR Code desta tela.</li>
              </ol>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-700 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Passo 2</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-100">Configure e confirme seu acesso</h3>
              {setup.enrollment?.uri ? (
                <div className="mt-4 flex justify-center rounded-lg border border-slate-700 bg-white p-4">
                  <QRCodeComponent value={setup.enrollment.uri} size={180} bgColor="#ffffff" fgColor="#111827" />
                </div>
              ) : (
                <p className="mt-3 text-sm text-amber-300">Não foi possível gerar o QR Code para este convite.</p>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Escaneie o QR Code acima no aplicativo e, em seguida, digite o código de 6 dígitos no formulário ao lado.
              </p>

              <button
                type="button"
                onClick={() => setShowSecret((prev) => !prev)}
                className="mt-4 text-sm font-semibold text-red-300 hover:text-red-200"
              >
                {showSecret ? 'Ocultar chave manual' : 'Não conseguiu ler o QR Code? Usar chave manual'}
              </button>

              {showSecret && (
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
                  <p className="text-xs text-slate-400">Insira esta chave no app autenticador:</p>
                  <p className="mt-1 break-all font-mono text-base tracking-wider text-red-300">{setup.enrollment?.secret}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Emissor: {setup.enrollment?.issuer} • Conta: {setup.enrollment?.accountName}
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-xl border border-slate-700 bg-slate-950 p-5">
              <h3 className="text-lg font-semibold text-slate-100">Crie sua senha e finalize</h3>
              <p className="mt-2 text-sm text-slate-400">
                Depois de configurar o aplicativo, informe o código de 6 dígitos para finalizar seu primeiro acesso.
              </p>

              <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
                <InputField
                  label="Nova senha"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  pattern={passwordPattern}
                  title={passwordPolicy.message}
                  required
                />
                <InputField
                  label="Confirmar nova senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  pattern={passwordPattern}
                  title={passwordPolicy.message}
                  required
                />
                <InputField
                  label="Código do autenticador"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />

                <p className="text-xs text-slate-500">{passwordPolicy.message}</p>

                {submitError && (
                  <div className="rounded-md border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    {submitSuccess}
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Ativando conta...' : 'Concluir primeiro acesso'}
                </Button>
              </form>
            </article>
          </section>

          {submitSuccess ? (
            <p className="text-center text-sm text-emerald-300">Primeiro acesso concluído. Redirecionando para login...</p>
          ) : null}
        </>
      )}
    </div>
  );
};
