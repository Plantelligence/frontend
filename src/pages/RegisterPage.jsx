import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { InputField } from '../components/InputField.jsx';
import { Button } from '../components/Button.jsx';
import { register, confirmRegistration, finalizeRegistration } from '../api/authService.js';
import { isPasswordCompliant, passwordPattern, passwordPolicy } from '../utils/passwordPolicy.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

const QRCodeComponent = QRCode?.default ?? QRCode;

const initialState = {
  fullName: '',
  organizationName: '',
  email: '',
  password: '',
  confirmPassword: '',
  consent: false
};

export const RegisterPage = () => {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [challenge, setChallenge] = useState(null);
  const [emailCode, setEmailCode] = useState('');
  const [otpSetup, setOtpSetup] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (step === 'form') {
      if (form.password !== form.confirmPassword) {
        setError('As senhas precisam coincidir.');
        return;
      }
      if (!isPasswordCompliant(form.password)) {
        setError(passwordPolicy.message);
        return;
      }
      if (!form.consent) {
        setError('Consentimento LGPD é obrigatório para o cadastro.');
        return;
      }

      setLoading(true);
      try {
        const result = await register({
          fullName: form.fullName,
          organizationName: form.organizationName,
          email: form.email,
          password: form.password,
          consent: form.consent
        });
        setChallenge(result);
        setStep('email');
        setSuccess('Enviamos um código de verificação para o e-mail informado. Valide para continuar a configuração de acesso ao console da estufa.');
        setEmailCode('');
        setOtpSetup(null);
        setOtpCode('');
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Não foi possível iniciar o cadastro agora.', 'register'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 'email') {
      if (!challenge?.challengeId) {
        setError('Solicitação de cadastro expirada. Reenvie os dados.');
        setStep('form');
        setChallenge(null);
        return;
      }

      if (!emailCode.trim()) {
        setError('Informe o código recebido por e-mail.');
        return;
      }

      setLoading(true);
      try {
        const response = await confirmRegistration({
          challengeId: challenge.challengeId,
          code: emailCode.trim()
        });

        if (response.nextStep === 'otp') {
          setOtpSetup(response);
          setStep('email-confirmed');
          setSuccess('E-mail confirmado com sucesso. Clique em continuar para configurar o aplicativo autenticador.');
          setOtpCode('');
        } else {
          setError('Fluxo de cadastro inválido.');
        }
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Não foi possível confirmar o código enviado por e-mail.', 'mfa'));
      } finally {
        setLoading(false);
      }

      return;
    }

    if (step === 'otp') {
      if (!otpSetup?.otpSetupId) {
        setError('Configuração OTP expirada. Reinicie o cadastro.');
        setStep('form');
        setOtpSetup(null);
        setOtpCode('');
        return;
      }

      if (!otpCode.trim()) {
        setError('Informe o código exibido no aplicativo autenticador.');
        return;
      }

      setLoading(true);
      try {
        await finalizeRegistration({
          otpSetupId: otpSetup.otpSetupId,
          otpCode: otpCode.trim()
        });
        setSuccess('Cadastro concluído! Redirecionando para login...');
        setForm(initialState);
        setChallenge(null);
        setEmailCode('');
        setOtpSetup(null);
        setOtpCode('');
        setStep('form');
        setTimeout(() => navigate('/login'), 1200);
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Não foi possível validar o aplicativo autenticador.', 'mfa'));
      } finally {
        setLoading(false);
      }

      return;
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);

    if (step !== 'email') {
      setError('Reenvio de código disponível apenas na etapa de verificação por e-mail.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('As senhas precisam coincidir.');
      setStep('form');
      return;
    }

    if (!isPasswordCompliant(form.password)) {
      setError(passwordPolicy.message);
      setStep('form');
      return;
    }

    if (!form.consent) {
      setError('Consentimento LGPD é obrigatório para o cadastro.');
      setStep('form');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        fullName: form.fullName,
        organizationName: form.organizationName,
        email: form.email,
        password: form.password,
        consent: form.consent
      });
      setChallenge(result);
      setSuccess('Um novo código de verificação foi enviado para o e-mail informado.');
      setEmailCode('');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível reenviar o código.', 'mfa'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setStep('form');
    setChallenge(null);
    setEmailCode('');
    setOtpSetup(null);
    setOtpCode('');
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-stone-700 bg-[#171112] p-8 shadow-xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Criação de conta</h1>
        <p className="mt-2 text-sm text-slate-400">
          Coletamos apenas dados mínimos para autenticação e rastreabilidade de operações nas estufas de cogumelos. Consentimento explícito é obrigatório pela LGPD.
        </p>
      </div>

      {error && <p className="rounded border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {success && <p className="rounded border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">{success}</p>}
      {step === 'form' ? (
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <InputField
            label="Nome completo"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            autoComplete="name"
            required
          />
          <InputField
            label="Nome da organização"
            name="organizationName"
            value={form.organizationName}
            onChange={handleChange}
            autoComplete="organization"
            required
          />
          <InputField
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
          <InputField
            label="Senha"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            pattern={passwordPattern}
            title={passwordPolicy.message}
            required
          />
          <InputField
            label="Confirme a senha"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            pattern={passwordPattern}
            title={passwordPolicy.message}
            required
          />
          <p className="md:col-span-2 text-xs text-slate-400">
            {passwordPolicy.message}
          </p>
          <div className="rounded-md border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300 md:col-span-2">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="consent"
                checked={form.consent}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-red-500 focus:ring focus:ring-red-500/40"
                required
              />
              <span>
                Confirmo que autorizo o tratamento dos meus dados pessoais exclusivamente para operação do Plantelligence na automação e no monitoramento de estufas de cogumelos. Posso revogar este consentimento ou solicitar exclusão a qualquer momento.
              </span>
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Enviando...' : 'Criar conta'}
            </Button>
          </div>
        </form>
      ) : null}
      {step === 'email' && (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="rounded border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-100">
            <p>Enviamos um código de verificação para <strong>{form.email}</strong>.</p>
            <p className="mt-1 text-red-200/80">Informe o código abaixo para avançar para a configuração MFA do console da estufa.</p>
          </div>
          <InputField
            label="Código recebido por e-mail"
            name="emailCode"
            value={emailCode}
            onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            required
          />
          <div className="flex flex-col gap-3 md:flex-row">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Validando...' : 'Confirmar e-mail'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleResend}
              disabled={loading}
              className="w-full md:w-auto"
            >
              Reenviar código
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleEdit}
              disabled={loading}
              className="w-full md:w-auto"
            >
              Editar dados
            </Button>
          </div>
        </form>
      )}
      {step === 'email-confirmed' && otpSetup && (
        <div className="flex flex-col gap-4">
          <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <p className="font-semibold">E-mail validado.</p>
            <p className="mt-1 text-emerald-200/90">
              Agora vamos configurar o MFA do autenticador para concluir o cadastro master com segurança.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button
              type="button"
              onClick={() => {
                setStep('otp');
                setError(null);
              }}
              className="w-full md:w-auto"
            >
              Continuar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleEdit}
              className="w-full md:w-auto"
            >
              Reiniciar cadastro
            </Button>
          </div>
        </div>
      )}
      {step === 'otp' && otpSetup && (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="rounded border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-100">
            <p className="font-semibold text-red-200">Configure o aplicativo autenticador</p>
            <p className="mt-1 text-red-200/80">
              Escaneie o QR code ou utilize a chave abaixo em um aplicativo como Microsoft Authenticator, Google Authenticator ou Authy para proteger o acesso operacional.
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200">
            {otpSetup.uri && (
              <div className="mb-3 flex justify-center">
                <div className="rounded-xl border border-slate-700 bg-white p-3">
                  <QRCodeComponent value={otpSetup.uri} size={160} bgColor="#ffffff" fgColor="#1a0000" />
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400">Ou insira a chave manualmente no aplicativo</p>
            <p className="mt-1 font-mono text-lg tracking-wider text-red-300">{otpSetup.secret}</p>
            <p className="mt-2 text-xs text-slate-500">
              Conta: {otpSetup.accountName} • Emissor: {otpSetup.issuer}
            </p>
          </div>
          <InputField
            label="Primeiro código do autenticador"
            name="otpCode"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
          />
          <div className="flex flex-col gap-3 md:flex-row">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Validando...' : 'Finalizar cadastro'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleEdit}
              disabled={loading}
              className="w-full md:w-auto"
            >
              Reiniciar cadastro
            </Button>
          </div>
        </form>
      )}
      <p className="text-sm text-slate-400">
        Já possui conta?{' '}
        <Link to="/login" className="font-semibold text-red-300 hover:text-red-200">
          Voltar para login
        </Link>
      </p>
    </div>
  );
};
