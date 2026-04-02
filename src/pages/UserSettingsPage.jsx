// Pagina de configuracoes do usuario: perfil, seguranca e integracao via QR Code.
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { DashboardSideNav } from '../components/DashboardSideNav.jsx';
import { InputField } from '../components/InputField.jsx';
import {
  getProfile,
  updateProfile,
  changePassword,
  requestDeletion,
  startOtpEnrollment,
  confirmOtpEnrollment,
  requestPasswordChangeChallenge
} from '../api/userService.js';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';

const OPTIONAL_PROFILE_STORAGE_KEY = 'plantelligence-optional-profile';
const DEFAULT_OPTIONAL_PROFILE = {
  displayName: '',
  city: '',
  region: '',
  experienceLevel: '',
  productionGoal: '',
  notes: ''
};

export const UserSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'perfil' ? 'perfil' : 'config';

  const { user, updateUser, requiresPasswordReset, setRequiresPasswordReset } = useAuthStore((state) => ({
    user: state.user,
    updateUser: state.updateUser,
    requiresPasswordReset: state.requiresPasswordReset,
    setRequiresPasswordReset: state.setRequiresPasswordReset
  }));

  const [profile, setProfile] = useState(user);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [confirmSaveProfile, setConfirmSaveProfile] = useState(false);
  const [confirmDeletion, setConfirmDeletion] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordMfaMethod, setPasswordMfaMethod] = useState(() =>
    user?.mfa?.otp?.configuredAt ? 'otp' : 'email'
  );
  const [passwordOtpCode, setPasswordOtpCode] = useState('');
  const [passwordChallenge, setPasswordChallenge] = useState(null);
  const [passwordChallengeCode, setPasswordChallengeCode] = useState('');
  const [passwordChallengeLoading, setPasswordChallengeLoading] = useState(false);
  const [passwordChallengeFeedback, setPasswordChallengeFeedback] = useState(null);
  const [passwordChallengeError, setPasswordChallengeError] = useState(null);

  const [enrollment, setEnrollment] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  const [otpError, setOtpError] = useState(null);
  const [optionalProfile, setOptionalProfile] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_OPTIONAL_PROFILE;
    }

    try {
      const raw = window.localStorage.getItem(OPTIONAL_PROFILE_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_OPTIONAL_PROFILE;
      }
      const parsed = JSON.parse(raw);
      return {
        displayName: parsed?.displayName ?? '',
        city: parsed?.city ?? '',
        region: parsed?.region ?? '',
        experienceLevel: parsed?.experienceLevel ?? '',
        productionGoal: parsed?.productionGoal ?? '',
        notes: parsed?.notes ?? ''
      };
    } catch (_error) {
      return DEFAULT_OPTIONAL_PROFILE;
    }
  });
  const [showOptionalDetails, setShowOptionalDetails] = useState(() =>
    Object.values(optionalProfile).some((value) => String(value).trim().length > 0)
  );
  const [optionalProfileFeedback, setOptionalProfileFeedback] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const result = await getProfile();
        setProfile(result.user);
        updateUser(result.user);
      } catch (err) {
        setProfileError(err.response?.data?.message ?? 'Não foi possível carregar o perfil.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [updateUser]);

  const otpConfigured = Boolean(profile?.mfa?.otp?.configuredAt);

  useEffect(() => {
    setPasswordMfaMethod((prev) => {
      if (!otpConfigured && prev === 'otp') {
        return 'email';
      }
      if (!prev) {
        return otpConfigured ? 'otp' : 'email';
      }
      return prev;
    });
  }, [otpConfigured]);

  useEffect(() => {
    if (passwordMfaMethod === 'otp') {
      setPasswordChallenge(null);
      setPasswordChallengeCode('');
      setPasswordChallengeFeedback(null);
      setPasswordChallengeError(null);
    } else if (passwordMfaMethod === 'email') {
      setPasswordOtpCode('');
    }
  }, [passwordMfaMethod]);

  const handleProfileChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProfile((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleOptionalProfileChange = (event) => {
    const { name, value } = event.target;
    setOptionalProfile((prev) => ({ ...prev, [name]: value }));
    setOptionalProfileFeedback(null);
  };

  const handleSaveOptionalProfile = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(OPTIONAL_PROFILE_STORAGE_KEY, JSON.stringify(optionalProfile));
    setOptionalProfileFeedback('Informações opcionais salvas localmente neste dispositivo.');
  };

  const handleClearOptionalProfile = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(OPTIONAL_PROFILE_STORAGE_KEY);
    }
    setOptionalProfile(DEFAULT_OPTIONAL_PROFILE);
    setShowOptionalDetails(false);
    setOptionalProfileFeedback('Informações opcionais removidas deste dispositivo.');
  };

  const submitProfileUpdate = async () => {
    setConfirmSaveProfile(false);
    setProfileFeedback(null);
    setProfileError(null);
    try {
      const result = await updateProfile({
        fullName: profile?.fullName,
        phone: profile?.phone,
        consentGiven: profile?.consentGiven
      });
      setProfile(result.user);
      updateUser(result.user);
      setProfileFeedback('Dados atualizados com sucesso.');
    } catch (err) {
      setProfileError(err.response?.data?.message ?? 'Falha ao atualizar dados.');
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordFeedback(null);
    setPasswordError(null);
     setPasswordChallengeError(null);
    try {
      let verification;

      if (passwordMfaMethod === 'otp') {
        if (passwordOtpCode.trim().length !== 6) {
          setPasswordError('Informe o código de 6 dígitos do autenticador.');
          return;
        }
        verification = { otpCode: passwordOtpCode.trim() };
      } else {
        if (!passwordChallenge?.challengeId) {
          setPasswordError('Solicite um código MFA por e-mail antes de alterar a senha.');
          return;
        }
        if (passwordChallengeCode.trim().length !== 6) {
          setPasswordError('Informe o código de 6 dígitos enviado por e-mail.');
          return;
        }
        verification = {
          challengeId: passwordChallenge.challengeId,
          code: passwordChallengeCode.trim()
        };
      }

      const result = await changePassword({
        ...passwordForm,
        verification
      });
      setPasswordFeedback(result.message);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setPasswordOtpCode('');
      setPasswordChallenge(null);
      setPasswordChallengeCode('');
      setPasswordChallengeFeedback(null);
      setRequiresPasswordReset(false);
    } catch (err) {
      setPasswordError(err.response?.data?.message ?? 'Não foi possível alterar a senha.');
    }
  };

  const handleRequestPasswordChallenge = async () => {
    setPasswordChallengeError(null);
    setPasswordChallengeFeedback(null);
    setPasswordChallengeLoading(true);
    try {
      const challenge = await requestPasswordChangeChallenge();
      setPasswordChallenge(challenge);
      setPasswordChallengeCode('');
      setPasswordChallengeFeedback('Código MFA enviado para o seu e-mail.');
    } catch (err) {
      setPasswordChallengeError(err.response?.data?.message ?? 'Não foi possível enviar o código MFA.');
    } finally {
      setPasswordChallengeLoading(false);
    }
  };

  const handleDeletionRequest = async () => {
    setConfirmDeletion(false);
    setProfileFeedback(null);
    setProfileError(null);
    try {
      const result = await requestDeletion({ reason: 'Pedido via portal do usuário' });
      setProfileFeedback(result.message);
      setProfile((prev) => ({ ...prev, deletionRequested: true }));
    } catch (err) {
      setProfileError(err.response?.data?.message ?? 'Falha ao registrar solicitação.');
    }
  };

  const handleStartEnrollment = async () => {
    setOtpError(null);
    setOtpMessage(null);
    setOtpCode('');
    setOtpLoading(true);
    try {
      const result = await startOtpEnrollment();
      setEnrollment(result);
      setOtpMessage('Escaneie o QR Code e confirme com o primeiro código para habilitar o acesso seguro ao dashboard.');
    } catch (err) {
      setOtpError(err.response?.data?.message ?? 'Não foi possível iniciar a configuração do autenticador.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelEnrollment = () => {
    setEnrollment(null);
    setOtpCode('');
    setOtpMessage(null);
    setOtpError(null);
  };

  const handleConfirmEnrollment = async (event) => {
    event.preventDefault();

    if (!enrollment?.enrollmentId) {
      setOtpError('Inicie a configuração antes de validar o código.');
      return;
    }

    if (otpCode.trim().length !== 6) {
      setOtpError('Informe o código de 6 dígitos gerado pelo aplicativo.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);
    try {
      const result = await confirmOtpEnrollment({
        enrollmentId: enrollment.enrollmentId,
        code: otpCode.trim()
      });

      if (result?.user) {
        updateUser(result.user);
        setProfile(result.user);
      }

      setEnrollment(null);
      setOtpCode('');
      setOtpMessage('Autenticador configurado com sucesso.');
    } catch (err) {
      setOtpError(err.response?.data?.message ?? 'Não foi possível validar o código informado.');
    } finally {
      setOtpLoading(false);
    }
  };

  const otpConfiguredAt = profile?.mfa?.otp?.configuredAt ?? null;
  const passwordChallengeExpiresLabel = passwordChallenge?.expiresAt
    ? (() => {
        const expires = new Date(passwordChallenge.expiresAt);
        return Number.isNaN(expires.getTime())
          ? null
          : expires.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            });
      })()
    : null;

  const lightInputClass = 'border-stone-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-red-400 focus:ring-red-100';
  const lightLabelClass = 'text-slate-700';
  const tabButtonBase = 'rounded-full border px-4 py-2 text-sm font-semibold transition';

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <DashboardSideNav
            active="settings"
            footerText="Nesta tela você atualiza seus dados e segurança da conta."
          />

          <section className="overflow-hidden rounded-[26px] bg-[#f5f1eb] p-4 md:p-6 lg:h-[calc(100vh-160px)] lg:min-h-[640px] lg:max-h-[820px]">
          <div className="flex h-full flex-col gap-8 overflow-y-auto rounded-2xl border border-stone-300 bg-[#fcfaf7] p-6 pr-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">
          {activeTab === 'perfil' ? 'Perfil da Conta' : 'Configurações e Segurança'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {activeTab === 'perfil'
            ? 'Gerencie dados básicos e opcionais do seu perfil, sempre respeitando princípios LGPD.'
            : 'Ajuste segurança, MFA e preferências de privacidade da sua conta.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'perfil' })}
            className={`${tabButtonBase} ${
              activeTab === 'perfil'
                ? 'border-red-600 bg-red-600 text-red-50'
                : 'border-stone-300 bg-white text-slate-700 hover:border-red-300 hover:text-red-700'
            }`}
          >
            Perfil
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'config' })}
            className={`${tabButtonBase} ${
              activeTab === 'config'
                ? 'border-red-600 bg-red-600 text-red-50'
                : 'border-stone-300 bg-white text-slate-700 hover:border-red-300 hover:text-red-700'
            }`}
          >
            Configurações
          </button>
        </div>
      </header>

      {requiresPasswordReset && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Sua senha expirada precisa ser atualizada para manter o acesso ao monitoramento e automação das estufas.
        </div>
      )}

      {profileError && (
        <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {profileError}
        </div>
      )}
      {profileFeedback && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {profileFeedback}
        </div>
      )}

      {activeTab === 'perfil' ? (
      <>
      <section id="dados" className="rounded-md border border-stone-300 bg-white p-6 text-sm text-slate-700">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Informações essenciais</h2>
            <p className="text-xs text-slate-500">Somente dados necessários para uso da plataforma.</p>
          </div>
          <Button variant="secondary" onClick={() => setConfirmSaveProfile(true)} disabled={loadingProfile}>
            Salvar alterações
          </Button>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Nome completo"
            name="fullName"
            value={profile?.fullName ?? ''}
            onChange={handleProfileChange}
            disabled={loadingProfile}
            className={lightInputClass}
            labelClassName={lightLabelClass}
          />
          <InputField
            label="Telefone"
            name="phone"
            value={profile?.phone ?? ''}
            onChange={handleProfileChange}
            disabled={loadingProfile}
            className={lightInputClass}
            labelClassName={lightLabelClass}
          />
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="consentGiven"
            checked={profile?.consentGiven ?? false}
            onChange={handleProfileChange}
            className="mt-1 h-4 w-4 rounded border-stone-400 bg-white text-red-600 focus:ring focus:ring-red-500/30"
            disabled={loadingProfile}
          />
          <span>Continuo autorizando o uso dos meus dados somente para automação e monitoramento das estufas.</span>
        </label>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-xs text-slate-600">
          <div>
            <dt className="font-semibold text-slate-700">E-mail operacional</dt>
            <dd>{profile?.email}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Função / RBAC</dt>
            <dd>{profile?.role}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Último acesso</dt>
            <dd>{profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Nunca registrado'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Senha expira em</dt>
            <dd>{profile?.passwordExpiresAt ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-md border border-stone-300 bg-white p-6 text-sm text-slate-700">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Informações opcionais de perfil</h2>
            <p className="text-xs text-slate-500">
              Preenchimento opcional para personalizar sua experiência. Não enviamos estes dados ao servidor.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOptionalDetails((prev) => !prev)}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700 transition hover:border-red-300 hover:text-red-700"
          >
            {showOptionalDetails ? 'Ocultar detalhes' : 'Adicionar detalhes'}
          </button>
        </header>
        {optionalProfileFeedback ? (
          <p className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {optionalProfileFeedback}
          </p>
        ) : null}
        {showOptionalDetails ? (
          <>
            <div className="mb-4 rounded-xl border border-stone-200 bg-[#fcfaf7] px-3 py-2 text-xs text-slate-600">
              Use apenas dados não sensíveis. Essas informações são opcionais e ficam salvas neste dispositivo e navegador, até você clicar em "Limpar opcionais" ou apagar os dados do navegador.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Nome de exibição (opcional)"
                name="displayName"
                value={optionalProfile.displayName}
                onChange={handleOptionalProfileChange}
                className={lightInputClass}
                labelClassName={lightLabelClass}
                placeholder="Como prefere ser chamado"
              />
              <InputField
                label="Cidade (opcional)"
                name="city"
                value={optionalProfile.city}
                onChange={handleOptionalProfileChange}
                className={lightInputClass}
                labelClassName={lightLabelClass}
                placeholder="Ex.: Curitiba"
              />
              <InputField
                label="Estado/UF (opcional)"
                name="region"
                value={optionalProfile.region}
                onChange={handleOptionalProfileChange}
                className={lightInputClass}
                labelClassName={lightLabelClass}
                placeholder="Ex.: PR"
              />
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>Nível de experiência (opcional)</span>
                <select
                  name="experienceLevel"
                  value={optionalProfile.experienceLevel}
                  onChange={handleOptionalProfileChange}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Selecionar</option>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                <span>Objetivo principal (opcional)</span>
                <select
                  name="productionGoal"
                  value={optionalProfile.productionGoal}
                  onChange={handleOptionalProfileChange}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Selecionar</option>
                  <option value="estudo">Estudo e aprendizado</option>
                  <option value="producao-pequena">Produção em pequena escala</option>
                  <option value="producao-comercial">Produção comercial</option>
                </select>
              </label>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Observações (opcional)</label>
              <textarea
                name="notes"
                value={optionalProfile.notes}
                onChange={handleOptionalProfileChange}
                rows={3}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="Ex.: prefiro alertas no período da manhã."
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleSaveOptionalProfile}>
                Salvar opcionais
              </Button>
              <Button variant="danger" onClick={handleClearOptionalProfile}>
                Limpar opcionais
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">
            Clique em Adicionar detalhes para preencher informações extras de forma opcional.
          </p>
        )}
      </section>
      </>
      ) : null}

      {activeTab === 'config' ? (
      <>
      <section id="senha" className="rounded-md border border-stone-300 bg-white p-6 text-sm text-slate-700">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Credenciais e autenticação primária</h2>
          <p className="text-xs text-slate-500">Trocar a senha invalida tokens antigos e registra evento de auditoria operacional.</p>
        </header>
        {passwordError && (
          <p className="mb-4 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {passwordError}
          </p>
        )}
        {passwordChallengeError && (
          <p className="mb-4 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {passwordChallengeError}
          </p>
        )}
        {passwordFeedback && (
          <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {passwordFeedback}
          </p>
        )}
        <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          <InputField
            label="Senha atual"
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
            }
            required
            autoComplete="current-password"
            className={lightInputClass}
            labelClassName={lightLabelClass}
          />
          <InputField
            label="Nova senha"
            type="password"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
            }
            required
            autoComplete="new-password"
            className={lightInputClass}
            labelClassName={lightLabelClass}
          />
          <div className="rounded-md border border-stone-300 bg-[#fcfaf7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Confirmação MFA</p>
            <p className="mt-1 text-xs text-slate-500">
              Confirme com o segundo fator antes de concluir a atualização de credenciais.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {otpConfigured && (
                <label className="flex cursor-pointer items-center gap-2 rounded border border-stone-300 bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-700">
                  <input
                    type="radio"
                    name="password-mfa-method"
                    value="otp"
                    checked={passwordMfaMethod === 'otp'}
                    onChange={() => setPasswordMfaMethod('otp')}
                    className="h-3 w-3"
                  />
                  Aplicativo autenticador
                </label>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded border border-stone-300 bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-700">
                <input
                  type="radio"
                  name="password-mfa-method"
                  value="email"
                  checked={passwordMfaMethod === 'email'}
                  onChange={() => setPasswordMfaMethod('email')}
                  className="h-3 w-3"
                />
                E-mail corporativo
              </label>
            </div>
            {passwordMfaMethod === 'otp' ? (
              <div className="mt-4">
                <InputField
                  label="Código do autenticador"
                  name="passwordOtpCode"
                  value={passwordOtpCode}
                  onChange={(event) => setPasswordOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  required
                  className={lightInputClass}
                  labelClassName={lightLabelClass}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Use o aplicativo autenticador configurado para esta conta.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRequestPasswordChallenge}
                    disabled={passwordChallengeLoading}
                  >
                    {passwordChallengeLoading ? 'Enviando...' : 'Enviar código por e-mail'}
                  </Button>
                  <span className="text-xs text-slate-400">
                    {passwordChallengeExpiresLabel
                      ? `Expira às ${passwordChallengeExpiresLabel}.`
                        : 'Código válido por aproximadamente 5 minutos para segurança da operação.'}
                  </span>
                </div>
                {passwordChallengeFeedback && (
                  <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {passwordChallengeFeedback}
                  </p>
                )}
                <InputField
                  label="Código recebido por e-mail"
                  name="passwordChallengeCode"
                  value={passwordChallengeCode}
                  onChange={(event) => setPasswordChallengeCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  required
                  className={lightInputClass}
                  labelClassName={lightLabelClass}
                />

              </div>
            )}
          </div>
          <Button type="submit">Atualizar senha</Button>
        </form>
      </section>

      <section id="autenticador" className="rounded-md border border-red-300 bg-red-50/60 p-6 text-sm text-slate-700">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-red-800">Aplicativo autenticador (MFA)</h2>
          <p className="text-xs text-red-700/90">
            Gere códigos temporários mesmo sem acesso ao e-mail operacional. Isso garante continuidade da operação da estufa.
          </p>
        </header>
        {otpError && (
          <p className="mb-4 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{otpError}</p>
        )}
        {otpMessage && (
          <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{otpMessage}</p>
        )}
        <p className="text-xs text-red-700/90">
          Status atual: {otpConfiguredAt ? `Configurado em ${new Date(otpConfiguredAt).toLocaleString()}` : 'Ainda não configurado'}.
        </p>
        {!enrollment ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={handleStartEnrollment} disabled={otpLoading}>
              {otpConfiguredAt ? 'Reconfigurar autenticador' : 'Configurar autenticador'}
            </Button>
            {otpConfiguredAt && (
              <span className="text-xs text-red-700/90">A reconfiguração substitui o segredo atual.</span>
            )}
          </div>
        ) : null}

        {profile?.mfa?.email && (
          <p className="mt-4 text-xs text-red-700/90">
            MFA por e-mail configurado em {profile.mfa.email.configuredAt ? new Date(profile.mfa.email.configuredAt).toLocaleString() : 'data não registrada'}.
          </p>
        )}

        {enrollment ? (
          <div className="mt-6 flex flex-col gap-4 rounded-md border border-stone-300 bg-white p-4">
            <p className="text-sm text-slate-700">
              Escaneie o QR Code abaixo ou utilize a chave secreta no aplicativo autenticador para proteger o acesso ao console de telemetria.
            </p>
            <div className="flex flex-col items-center gap-3">
              {enrollment.uri ? (
                <QRCode value={enrollment.uri} size={180} bgColor="#0f172a" fgColor="#ef4444" />
              ) : null}
              <p className="text-xs text-slate-500">
                Conta: {enrollment.accountName} • Emissor: {enrollment.issuer}
              </p>
              <p className="break-all rounded-md bg-red-50 px-3 py-2 font-mono text-base tracking-wider text-red-700">
                {enrollment.secret}
              </p>

            </div>
            <form className="flex flex-col gap-3" onSubmit={handleConfirmEnrollment}>
              <InputField
                label="Código do autenticador"
                name="otpCode"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                required
                className={lightInputClass}
                labelClassName={lightLabelClass}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={otpLoading || otpCode.length !== 6}>
                  {otpLoading ? 'Validando...' : 'Confirmar autenticador'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancelEnrollment} disabled={otpLoading}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </section>

      <section id="lgpd" className="rounded-md border border-rose-300 bg-rose-50 p-6 text-sm text-rose-800">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-rose-900">Direito ao esquecimento</h2>
          <p className="text-xs text-rose-800">
            Registramos o pedido e garantimos a anonimização conforme os fluxos LGPD do Plantelligence para dados de operação.
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="danger" onClick={() => setConfirmDeletion(true)} disabled={profile?.deletionRequested}>
            {profile?.deletionRequested ? 'Solicitação pendente' : 'Solicitar exclusão de dados'}
          </Button>
          {profile?.deletionRequested && (
            <span className="text-xs text-rose-800">Pedido registrado. O DPO notificará quando a remoção for concluída.</span>
          )}
        </div>
      </section>
      </>
      ) : null}

      <ConfirmDialog
        open={confirmSaveProfile}
        title="Confirmar atualização"
        description="Confirme a atualização dos seus dados cadastrados no Plantelligence."
        onCancel={() => setConfirmSaveProfile(false)}
        onConfirm={submitProfileUpdate}
      />
      <ConfirmDialog
        open={confirmDeletion}
        title="Excluir meus dados"
        description="Esta ação registra o pedido de exclusão conforme a LGPD e suspende os acessos ao ambiente de monitoramento."
        confirmLabel="Solicitar exclusão"
        onCancel={() => setConfirmDeletion(false)}
        onConfirm={handleDeletionRequest}
      />
          </div>
          </section>
        </div>
      </div>
    </div>
  );
};
