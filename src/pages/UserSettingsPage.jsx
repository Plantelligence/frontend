import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
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
import { deactivateOrganization } from '../api/adminService.js';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

const QRCodeComponent = QRCode?.default ?? QRCode;

const roleLabel = (profile) => {
  if (profile?.role === 'Admin') {
    const isCreator = profile?.organizationOwnerId && profile?.organizationOwnerId === profile?.id;
    return isCreator ? 'Administrador master' : 'Administrador de usuários';
  }
  if (profile?.role === 'Reader') {
    return 'Leitor';
  }
  return 'Colaborador';
};

const formatDateOnly = (value) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleDateString('pt-BR');
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
  const clearSession = useAuthStore((state) => state.clearSession);

  const [profile, setProfile] = useState(user);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileConsentConfirm, setProfileConsentConfirm] = useState(false);
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

  const [orgDeleteLoading, setOrgDeleteLoading] = useState(false);
  const [orgDeleteFeedback, setOrgDeleteFeedback] = useState(null);
  const [orgDeleteError, setOrgDeleteError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const result = await getProfile();
        setProfile(result.user);
        setProfileConsentConfirm(false);
        updateUser(result.user);
      } catch (err) {
        setProfileError(getFriendlyErrorMessage(err, 'Não foi possível carregar os dados da conta.'));
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

  const submitProfileUpdate = async () => {
    setConfirmSaveProfile(false);
    setProfileFeedback(null);
    setProfileError(null);

    if (!profileConsentConfirm) {
      setProfileError('Marque o consentimento para salvar as alterações de nome e organização.');
      return;
    }

    try {
      const result = await updateProfile({
        fullName: profile?.fullName,
        consentGiven: true,
        organizationName: (profile?.organizationName || '').trim() || undefined
      });
      setProfile(result.user);
      setProfileConsentConfirm(false);
      updateUser(result.user);
      setProfileFeedback('Dados atualizados com sucesso.');
    } catch (err) {
      setProfileError(getFriendlyErrorMessage(err, 'Não foi possível atualizar os dados agora.'));
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
      setPasswordError(getFriendlyErrorMessage(err, 'Não foi possível alterar a senha agora.', 'mfa'));
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
      setPasswordChallengeFeedback(
        `Código MFA enviado para o e-mail de cadastro da conta: ${profile?.email ?? 'seu e-mail de cadastro'}.`
      );
    } catch (err) {
      setPasswordChallengeError(getFriendlyErrorMessage(err, 'Não foi possível enviar o código de verificação.', 'mfa'));
    } finally {
      setPasswordChallengeLoading(false);
    }
  };

  const handleDeletionRequest = async () => {
    setConfirmDeletion(false);
    setProfileFeedback(null);
    setProfileError(null);
    try {
      await requestDeletion({ reason: 'Pedido via portal do usuário' });
      setProfileFeedback(
        'Solicitação registrada. Sua conta de acesso e seus dados pessoais deste ambiente entrarão em processo de exclusão, mantendo apenas o mínimo exigido por obrigação legal.'
      );
      setProfile((prev) => ({ ...prev, deletionRequested: true }));
    } catch (err) {
      setProfileError(getFriendlyErrorMessage(err, 'Não foi possível registrar a solicitação agora.'));
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
      setOtpError(getFriendlyErrorMessage(err, 'Não foi possível iniciar a configuração do autenticador.', 'mfa'));
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
      setOtpError(getFriendlyErrorMessage(err, 'Não foi possível validar o código informado.', 'mfa'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDeactivateOrganization = async () => {
    const isCreator = profile?.organizationOwnerId && profile?.organizationOwnerId === profile?.id;
    if (!isCreator) {
      setOrgDeleteError('Somente o usuário criador pode desativar a organização.');
      return;
    }

    const confirmed = window.confirm(
      'Esta ação apagará a organização inteira, incluindo usuários, estufas, cultivos e dados vinculados. Essa operação é irreversível. Deseja continuar?'
    );
    if (!confirmed) {
      return;
    }

    setOrgDeleteError(null);
    setOrgDeleteFeedback(null);
    setOrgDeleteLoading(true);
    try {
      const result = await deactivateOrganization();
      setOrgDeleteFeedback(
        `Organização excluída com sucesso. Usuários removidos: ${result?.affectedUsers ?? 0}. Estufas legadas removidas: ${result?.deletedLegacyGreenhouses ?? 0}. Estufas do novo painel removidas: ${result?.deletedModernGreenhouses ?? 0}. Sua sessão será encerrada.`
      );
      clearSession();
      window.location.assign('/login');
    } catch (err) {
      setOrgDeleteError(getFriendlyErrorMessage(err, 'Não foi possível desativar a organização agora.'));
    } finally {
      setOrgDeleteLoading(false);
    }
  };

  const otpConfiguredAt = profile?.mfa?.otp?.configuredAt ?? null;
  const isMasterOwner = Boolean(profile?.organizationOwnerId && profile?.organizationOwnerId === profile?.id);
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
          <section className="overflow-hidden rounded-[26px] bg-[#f5f1eb] p-4 md:p-6 lg:h-[calc(100vh-160px)] lg:min-h-[640px] lg:max-h-[820px]">
          <div className="flex h-full flex-col gap-8 overflow-y-auto rounded-2xl border border-stone-300 bg-[#fcfaf7] p-6 pr-4">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800">
          {activeTab === 'perfil' ? 'Perfil da Conta' : 'Configurações e Segurança'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {activeTab === 'perfil'
            ? 'Gerencie os dados essenciais da sua conta, sempre respeitando princípios LGPD.'
            : 'Ajuste segurança, MFA e preferências de privacidade da sua conta.'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
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
      <section id="dados" className="mx-auto w-full max-w-4xl rounded-md border border-stone-300 bg-white p-6 text-sm text-slate-700">
        <header className="mb-4 flex flex-col items-center gap-3 text-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Informações essenciais</h2>
            <p className="text-xs text-slate-500">Somente dados necessários para uso da plataforma.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setConfirmSaveProfile(true)}
            disabled={loadingProfile || !profileConsentConfirm}
          >
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
            label="Nome da organização"
            name="organizationName"
            value={profile?.organizationName ?? ''}
            onChange={handleProfileChange}
            disabled={loadingProfile || profile?.role !== 'Admin'}
            className={lightInputClass}
            labelClassName={lightLabelClass}
          />
        </div>
        {profile?.role !== 'Admin' ? (
          <p className="mt-2 text-xs text-slate-500">
            Somente administradores podem alterar o nome da organização.
          </p>
        ) : null}
        <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="profileConsentConfirm"
            checked={profileConsentConfirm}
            onChange={(event) => setProfileConsentConfirm(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-stone-400 bg-white text-red-600 focus:ring focus:ring-red-500/30"
            disabled={loadingProfile}
          />
          <span>Continuo autorizando o uso dos meus dados somente para automação e monitoramento das estufas.</span>
        </label>
        {!profileConsentConfirm ? (
          <p className="mt-2 text-xs text-amber-700">
            Marque o consentimento para habilitar o botão de salvar alterações.
          </p>
        ) : null}
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-xs text-slate-600">
          <div>
            <dt className="font-semibold text-slate-700">E-mail operacional</dt>
            <dd>{profile?.email}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Permissão</dt>
            <dd>{roleLabel(profile)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Último acesso</dt>
            <dd>{profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Nunca registrado'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Senha expira em</dt>
            <dd>{formatDateOnly(profile?.passwordExpiresAt)}</dd>
          </div>
        </dl>
      </section>
      </>
      ) : null}

      {activeTab === 'config' ? (
      <>
      <section id="senha" className="mx-auto w-full max-w-4xl rounded-md border border-stone-300 bg-white p-6 text-sm text-slate-700">
        <header className="mb-4 text-center">
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
          <div className="mx-auto w-full max-w-[320px]">
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
              className={`${lightInputClass} text-center`}
              labelClassName={`${lightLabelClass} text-center items-center`}
            />
          </div>
          <div className="mx-auto w-full max-w-[320px]">
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
              className={`${lightInputClass} text-center`}
              labelClassName={`${lightLabelClass} text-center items-center`}
            />
          </div>
          <div className="rounded-md border border-stone-300 bg-[#fcfaf7] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Confirmação MFA</p>
            <p className="mt-1 text-xs text-slate-500">
              Confirme com o segundo fator antes de concluir a atualização de credenciais.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
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
                E-mail de cadastro
              </label>
            </div>
            {passwordMfaMethod === 'otp' ? (
              <div className="mt-4">
                <div className="mx-auto max-w-[220px]">
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
                    className={`${lightInputClass} text-center font-mono tracking-[0.18em]`}
                    labelClassName={`${lightLabelClass} text-center items-center`}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Use o aplicativo autenticador configurado para esta conta.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-center">
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRequestPasswordChallenge}
                    disabled={passwordChallengeLoading}
                  >
                    {passwordChallengeLoading ? 'Enviando...' : 'Enviar código para meu e-mail'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  {`O código será enviado para o e-mail de cadastro: ${profile?.email ?? 'seu e-mail de cadastro'}.`}
                </p>
                <p className="text-xs text-slate-500">
                  {passwordChallengeExpiresLabel
                    ? `Expira às ${passwordChallengeExpiresLabel}.`
                      : 'Código válido por aproximadamente 5 minutos para segurança da operação.'}
                </p>
                {passwordChallengeFeedback && (
                  <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {passwordChallengeFeedback}
                  </p>
                )}
                <div className="mx-auto max-w-[220px]">
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
                    className={`${lightInputClass} text-center font-mono tracking-[0.18em]`}
                    labelClassName={`${lightLabelClass} text-center items-center`}
                  />
                </div>

              </div>
            )}
          </div>
          <div className="flex justify-center">
            <Button type="submit">Atualizar senha</Button>
          </div>
        </form>
      </section>

      <section id="autenticador" className="mx-auto w-full max-w-4xl rounded-md border border-red-300 bg-red-50/60 p-6 text-sm text-slate-700">
        <header className="mb-3 text-center">
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
        <p className="text-center text-xs text-red-700/90">
          Status atual: {otpConfiguredAt ? `Configurado em ${new Date(otpConfiguredAt).toLocaleString()}` : 'Ainda não configurado'}.
        </p>
        {!enrollment ? (
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <Button onClick={handleStartEnrollment} disabled={otpLoading}>
              {otpConfiguredAt ? 'Reconfigurar autenticador' : 'Configurar autenticador'}
            </Button>
            {otpConfiguredAt && (
              <span className="text-xs text-red-700/90">A reconfiguração substitui o segredo atual.</span>
            )}
          </div>
        ) : null}

        {profile?.mfa?.email && (
          <p className="mt-4 text-center text-xs text-red-700/90">
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
                <QRCodeComponent value={enrollment.uri} size={180} bgColor="#0f172a" fgColor="#ef4444" />
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
                className={`${lightInputClass} text-center font-mono tracking-[0.18em]`}
                labelClassName={lightLabelClass}
              />
              <div className="flex flex-wrap items-center justify-center gap-3">
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

      {!isMasterOwner ? (
        <section id="lgpd" className="mx-auto w-full max-w-4xl rounded-md border border-rose-300 bg-rose-50 p-6 text-sm text-rose-800">
          <header className="mb-3 text-center">
            <h2 className="text-lg font-semibold text-rose-900">Exclusão do meu perfil neste ambiente</h2>
            <p className="text-xs text-rose-800">
              Ao solicitar a exclusão, seu perfil de acesso deste ambiente e seus dados pessoais entram no fluxo LGPD de remoção.
              Após a conclusão, você perde acesso a este ambiente e os dados pessoais são removidos ou anonimizados, mantendo apenas o mínimo exigido por obrigação legal.
            </p>
          </header>
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <Button variant="danger" onClick={() => setConfirmDeletion(true)} disabled={profile?.deletionRequested}>
              {profile?.deletionRequested ? 'Solicitação pendente' : 'Solicitar exclusão de dados'}
            </Button>
            {profile?.deletionRequested && (
              <span className="text-xs text-rose-800">Pedido registrado. Seu perfil e seus dados pessoais serão removidos deste ambiente ao final do processo.</span>
            )}
          </div>
        </section>
      ) : null}

      {isMasterOwner ? (
        <section id="organizacao-master" className="mx-auto w-full max-w-4xl rounded-md border border-rose-400 bg-rose-100 p-6 text-sm text-rose-900">
          <header className="mb-3 text-center">
            <h2 className="text-lg font-semibold">Administrador master: exclusão da organização</h2>
            <p className="text-xs text-rose-800">
              Somente o usuário criador da organização pode executar esta ação. Ao confirmar, a organização será excluída por completo,
              incluindo usuários, cultivos, estufas e demais dados vinculados ao contexto organizacional.
            </p>
          </header>

          {orgDeleteFeedback ? (
            <p className="mb-3 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
              {orgDeleteFeedback}
            </p>
          ) : null}

          {orgDeleteError ? (
            <p className="mb-3 rounded border border-rose-300 bg-white px-3 py-2 text-center text-sm text-rose-700">
              {orgDeleteError}
            </p>
          ) : null}

          <div className="flex justify-center">
            <Button variant="danger" onClick={handleDeactivateOrganization} disabled={orgDeleteLoading}>
              {orgDeleteLoading ? 'Apagando organização...' : 'Apagar organização por completo'}
            </Button>
          </div>
        </section>
      ) : null}
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
        title="Excluir meu perfil neste ambiente"
        description="Esta ação registra a exclusão do seu perfil de acesso e dos seus dados pessoais neste ambiente, conforme LGPD. O processo mantém apenas dados mínimos exigidos por obrigação legal."
        confirmLabel="Solicitar exclusão do perfil"
        onCancel={() => setConfirmDeletion(false)}
        onConfirm={handleDeletionRequest}
      />
          </div>
          </section>
      </div>
    </div>
  );
};
