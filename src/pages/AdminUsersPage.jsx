// Painel administrativo simplificado para criar usuários, ajustar nível e bloquear acesso.
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import {
  createUserByAdmin,
  deleteUserByAdmin,
  getUsers,
  listAssignableGreenhouses,
  resendUserInvite,
  updateReaderGreenhouses,
  updateUserAccessStatus,
  updateUserRole
} from '../api/adminService.js';
import { useAuthStore } from '../store/authStore.js';

const roleLabels = {
  Admin: 'Administrador de usuários',
  Collaborator: 'Colaborador',
  Reader: 'Leitor',
  User: 'Colaborador'
};

const roleOptions = [
  { value: 'Reader', label: 'Leitor' },
  { value: 'Collaborator', label: 'Colaborador' },
  { value: 'Admin', label: 'Administrador de usuários' }
];

const normalizeRole = (role) => {
  if (role === 'Admin' || role === 'Reader' || role === 'Collaborator') {
    return role;
  }
  return 'Collaborator';
};

export const AdminUsersPage = () => {
  const authUser = useAuthStore((state) => state.user);
  const updateUserStore = useAuthStore((state) => state.updateUser);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [greenhouses, setGreenhouses] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [roleDraftByUser, setRoleDraftByUser] = useState({});

  const [roleFeedback, setRoleFeedback] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [roleLoadingId, setRoleLoadingId] = useState(null);

  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    role: 'Collaborator',
    readerGreenhouseIds: []
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserFeedback, setCreateUserFeedback] = useState(null);
  const [createUserError, setCreateUserError] = useState(null);

  const [inviteLoadingId, setInviteLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [userActionFeedback, setUserActionFeedback] = useState(null);
  const [userActionError, setUserActionError] = useState(null);

  const [accessDraft, setAccessDraft] = useState({ blocked: false, reason: '' });
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessFeedback, setAccessFeedback] = useState(null);
  const [accessError, setAccessError] = useState(null);

  const [readerDraft, setReaderDraft] = useState([]);
  const [readerSaving, setReaderSaving] = useState(false);
  const [readerFeedback, setReaderFeedback] = useState(null);
  const [readerError, setReaderError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      setLoadingUsers(true);
      setUsersError(null);
      try {
        const [usersResult, greenhousesResult] = await Promise.all([
          getUsers(),
          listAssignableGreenhouses()
        ]);

        if (!active) {
          return;
        }

        const fetchedUsers = usersResult?.users ?? [];
        setUsers(fetchedUsers);
        setGreenhouses(greenhousesResult?.greenhouses ?? []);
        if (fetchedUsers.length > 0) {
          setSelectedUserId((prev) => prev ?? fetchedUsers[0].id);
        }
      } catch (error) {
        if (active) {
          setUsersError(error.response?.data?.message ?? 'Não foi possível carregar dados administrativos.');
        }
      } finally {
        if (active) {
          setLoadingUsers(false);
        }
      }
    };

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const nextDraft = {};
    for (const entry of users) {
      nextDraft[entry.id] = normalizeRole(entry.role);
    }
    setRoleDraftByUser(nextDraft);
  }, [users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  useEffect(() => {
    if (!selectedUser) {
      setAccessDraft({ blocked: false, reason: '' });
      setReaderDraft([]);
      return;
    }

    const permissions = selectedUser.permissions || {};
    setAccessDraft({
      blocked: Boolean(selectedUser.blocked),
      reason: selectedUser.blockedReason || ''
    });
    setReaderDraft(Array.isArray(permissions.allowedGreenhouseIds) ? permissions.allowedGreenhouseIds : []);
  }, [selectedUser]);

  const adminCount = useMemo(
    () => users.filter((entry) => normalizeRole(entry.role) === 'Admin').length,
    [users]
  );
  const collaboratorCount = useMemo(
    () => users.filter((entry) => normalizeRole(entry.role) === 'Collaborator').length,
    [users]
  );
  const readerCount = useMemo(
    () => users.filter((entry) => normalizeRole(entry.role) === 'Reader').length,
    [users]
  );
  const blockedCount = useMemo(() => users.filter((entry) => Boolean(entry.blocked)).length, [users]);

  const upsertUser = (updatedUser) => {
    setUsers((prev) => {
      const exists = prev.some((entry) => entry.id === updatedUser.id);
      if (exists) {
        return prev.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry));
      }
      return [updatedUser, ...prev];
    });
  };

  const removeUserFromList = (userId) => {
    setUsers((prev) => prev.filter((entry) => entry.id !== userId));
    setSelectedUserId((prev) => (prev === userId ? null : prev));
  };

  const invitationLabels = {
    pending: 'Convite pendente',
    accepted: 'Usuário criado por completo',
    expired: 'Convite expirado'
  };

  const invitationClassByStatus = {
    pending: 'border-amber-300 bg-amber-50 text-amber-700',
    accepted: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    expired: 'border-rose-300 bg-rose-50 text-rose-700'
  };

  const resolveCanDelete = (listedUser) => {
    if (!listedUser || !authUser) {
      return false;
    }
    const isOrgCreator = listedUser.organizationOwnerId && listedUser.organizationOwnerId === listedUser.id;
    const isSelf = listedUser.id === authUser.id;
    const actorIsOrgCreator = authUser.organizationOwnerId && authUser.organizationOwnerId === authUser.id;
    if (isOrgCreator) {
      return false;
    }
    if (isSelf && actorIsOrgCreator) {
      return false;
    }
    return true;
  };

  const resolveCanResendInvite = (listedUser) => {
    if (!listedUser || !authUser) {
      return false;
    }
    const isSelf = listedUser.id === authUser.id;
    const hasAccepted = Boolean(listedUser.invitationAcceptedAt);
    const hasInviteTrace = Boolean(listedUser.invitationSentAt || listedUser.createdByUserId || listedUser.invitationStatus || listedUser.inviteExpiresAt);
    return !isSelf && !hasAccepted && hasInviteTrace;
  };

  const formatDateTime = (value) => {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toLocaleString();
  };

  const resolveInvitationStatus = (listedUser) => {
    if (!listedUser) {
      return null;
    }
    if (listedUser.invitationStatus) {
      return listedUser.invitationStatus;
    }
    if (listedUser.invitationAcceptedAt) {
      return 'accepted';
    }
    if (listedUser.invitationSentAt || listedUser.inviteExpiresAt || listedUser.createdByUserId) {
      if (listedUser.inviteExpiresAt) {
        const expires = new Date(listedUser.inviteExpiresAt);
        if (!Number.isNaN(expires.getTime()) && expires.getTime() < Date.now()) {
          return 'expired';
        }
      }
      return 'pending';
    }
    return null;
  };

  const handleRoleChange = async (userId, nextRole) => {
    setRoleFeedback(null);
    setRoleError(null);
    setRoleLoadingId(userId);
    try {
      const result = await updateUserRole({ userId, role: nextRole });
      const updatedUser = result?.user ?? null;
      if (updatedUser) {
        upsertUser(updatedUser);
        setRoleDraftByUser((prev) => ({ ...prev, [updatedUser.id]: normalizeRole(updatedUser.role) }));
        if (authUser?.id === updatedUser.id) {
          updateUserStore(updatedUser);
        }
        setRoleFeedback(`${updatedUser.email} agora possui o nível ${roleLabels[normalizeRole(nextRole)] ?? normalizeRole(nextRole)}.`);
      }
    } catch (error) {
      setRoleError(error.response?.data?.detail ?? error.response?.data?.message ?? 'Não foi possível atualizar o nível.');
    } finally {
      setRoleLoadingId(null);
    }
  };

  const handleCreateUserChange = (event) => {
    const { name, value } = event.target;
    setCreateUserFeedback(null);
    setCreateUserError(null);
    setCreateUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCreateReaderGreenhouse = (greenhouseId) => {
    setCreateUserForm((prev) => {
      const exists = prev.readerGreenhouseIds.includes(greenhouseId);
      return {
        ...prev,
        readerGreenhouseIds: exists
          ? prev.readerGreenhouseIds.filter((id) => id !== greenhouseId)
          : [...prev.readerGreenhouseIds, greenhouseId]
      };
    });
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    const fullName = createUserForm.fullName.trim();
    const email = createUserForm.email.trim().toLowerCase();
    if (!fullName || !email) {
      setCreateUserError('Informe nome completo e e-mail para criar o usuário.');
      return;
    }

    setCreateUserLoading(true);
    setCreateUserFeedback(null);
    setCreateUserError(null);

    try {
      const payload = {
        fullName,
        email,
        role: createUserForm.role,
        readerGreenhouseIds: createUserForm.role === 'Reader' ? createUserForm.readerGreenhouseIds : []
      };
      const result = await createUserByAdmin(payload);
      const createdUser = result?.user ?? null;
      if (createdUser) {
        upsertUser(createdUser);
        setSelectedUserId(createdUser.id);
      }

      setCreateUserForm({
        fullName: '',
        email: '',
        role: 'Collaborator',
        readerGreenhouseIds: []
      });

      if (result?.invitationSent) {
        setCreateUserFeedback(`Usuário criado e convite enviado para ${createdUser?.email ?? email}.`);
      } else {
        setCreateUserFeedback('Usuário criado. O envio do convite por e-mail não foi confirmado pelo servidor.');
      }
    } catch (error) {
      setCreateUserError(error.response?.data?.detail ?? error.response?.data?.message ?? 'Não foi possível criar o usuário.');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleResendInvite = async (listedUser) => {
    if (!listedUser) {
      return;
    }

    setUserActionFeedback(null);
    setUserActionError(null);
    setInviteLoadingId(listedUser.id);
    try {
      const result = await resendUserInvite({ userId: listedUser.id });
      setUserActionFeedback(
        result?.invitationSent
          ? `Convite reenviado para ${listedUser.email}.`
          : `Convite regenerado para ${listedUser.email}. O servidor não confirmou envio por e-mail.`
      );

      setUsers((prev) =>
        prev.map((entry) =>
          entry.id === listedUser.id
            ? {
                ...entry,
                invitationStatus: 'pending',
                inviteExpiresAt: result?.inviteExpiresAt ?? entry.inviteExpiresAt,
                invitationSentAt: new Date().toISOString()
              }
            : entry
        )
      );
    } catch (error) {
      setUserActionError(error.response?.data?.detail ?? error.response?.data?.message ?? 'Não foi possível reenviar o convite.');
    } finally {
      setInviteLoadingId(null);
    }
  };

  const handleDeleteUser = async (listedUser) => {
    if (!listedUser) {
      return;
    }

    const confirmed = window.confirm(
      `Confirmar remoção do acesso de ${listedUser.email}? Os dados criados permanecerão vinculados à organização.`
    );
    if (!confirmed) {
      return;
    }

    setUserActionFeedback(null);
    setUserActionError(null);
    setDeleteLoadingId(listedUser.id);
    try {
      await deleteUserByAdmin({ userId: listedUser.id });
      removeUserFromList(listedUser.id);
      setUserActionFeedback(`Acesso de ${listedUser.email} removido. Os dados da organização foram preservados.`);
    } catch (error) {
      setUserActionError(error.response?.data?.detail ?? error.response?.data?.message ?? 'Não foi possível remover o usuário.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleAccessStatusSave = async () => {
    if (!selectedUser) {
      return;
    }

    setAccessLoading(true);
    setAccessFeedback(null);
    setAccessError(null);

    try {
      const result = await updateUserAccessStatus({
        userId: selectedUser.id,
        blocked: accessDraft.blocked,
        reason: accessDraft.blocked ? accessDraft.reason.trim() : null
      });
      const updatedUser = result?.user ?? null;
      if (updatedUser) {
        upsertUser(updatedUser);
        if (authUser?.id === updatedUser.id) {
          updateUserStore(updatedUser);
        }
      }
      setAccessFeedback(accessDraft.blocked ? 'Usuário bloqueado com sucesso.' : 'Usuário desbloqueado com sucesso.');
    } catch (error) {
      setAccessError(error.response?.data?.detail ?? error.response?.data?.message ?? 'Não foi possível atualizar o status de acesso.');
    } finally {
      setAccessLoading(false);
    }
  };

  const toggleReaderGreenhouse = (greenhouseId) => {
    setReaderFeedback(null);
    setReaderError(null);
    setReaderDraft((prev) => {
      if (prev.includes(greenhouseId)) {
        return prev.filter((id) => id !== greenhouseId);
      }
      return [...prev, greenhouseId];
    });
  };

  const handleReaderAccessSave = async () => {
    if (!selectedUser) {
      return;
    }

    setReaderSaving(true);
    setReaderFeedback(null);
    setReaderError(null);
    try {
      const result = await updateReaderGreenhouses({
        userId: selectedUser.id,
        greenhouseIds: readerDraft
      });
      const updatedUser = result?.user ?? null;
      if (updatedUser) {
        upsertUser(updatedUser);
      }
      setReaderFeedback('Estufas delegadas ao leitor foram atualizadas.');
    } catch (error) {
      setReaderError(error.response?.data?.detail ?? error.response?.data?.message ?? 'Não foi possível salvar a delegação de estufas.');
    } finally {
      setReaderSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
        <header className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Administração do Sistema</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">Acesso de usuários</h1>
          <p className="mt-2 text-sm text-slate-600">
            Defina nível de acesso, bloqueie contas e delegue estufas para usuários leitores.
          </p>

          <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-xs text-slate-600">
            <p className="font-semibold uppercase tracking-[0.15em] text-slate-700">Níveis de acesso</p>
            <ul className="mt-2 space-y-1">
              <li>
                <span className="font-semibold text-slate-800">Administrador master:</span> usuário criador da organização, com controle total da organização.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Administrador de usuários:</span> gerencia usuários e permissões sem desativar a organização.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Colaborador:</span> acesso amplo às estufas para operação diária.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Leitor:</span> apenas consulta das estufas delegadas.
              </li>
            </ul>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Usuários</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{users.length}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Administradores</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{adminCount}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Colaboradores</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{collaboratorCount}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Leitores</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{readerCount}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Bloqueados</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{blockedCount}</p>
            </article>
          </div>

          {roleFeedback && (
            <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {roleFeedback}
            </p>
          )}
          {roleError && (
            <p className="mt-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {roleError}
            </p>
          )}
          {userActionFeedback && (
            <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {userActionFeedback}
            </p>
          )}
          {userActionError && (
            <p className="mt-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {userActionError}
            </p>
          )}
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <article className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6 lg:col-span-2">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Criar usuário</h2>
              <p className="text-xs text-slate-500">
                O sistema envia um convite de primeiro acesso por e-mail para o usuário definir a própria senha e configurar MFA.
              </p>
            </header>

            <form onSubmit={handleCreateUser} className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>Nome completo</span>
                <input
                  type="text"
                  name="fullName"
                  value={createUserForm.fullName}
                  onChange={handleCreateUserChange}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Ex.: Ana Souza"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  value={createUserForm.email}
                  onChange={handleCreateUserChange}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="usuario@empresa.com"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>Nível</span>
                <select
                  name="role"
                  value={createUserForm.role}
                  onChange={handleCreateUserChange}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Button type="submit" disabled={createUserLoading} className="w-full">
                  {createUserLoading ? 'Criando...' : 'Criar usuário'}
                </Button>
              </div>
            </form>

            {createUserForm.role === 'Reader' && (
              <div className="mt-4 rounded-xl border border-stone-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">Delegação inicial para leitor</p>
                <div className="mt-2 max-h-[190px] space-y-2 overflow-y-auto pr-1">
                  {greenhouses.map((item) => {
                    const checked = createUserForm.readerGreenhouseIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                          checked
                            ? 'border-red-300 bg-red-50 text-slate-800'
                            : 'border-stone-200 bg-white text-slate-700'
                        }`}
                      >
                        <span>
                          <span className="block font-semibold">{item.nome || item.id}</span>
                          <span className="block text-xs text-slate-500">{item.cidade || '-'} / {item.estado || '-'}</span>
                        </span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-stone-400 bg-white text-red-600 focus:ring focus:ring-red-500/30"
                          checked={checked}
                          onChange={() => toggleCreateReaderGreenhouse(item.id)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {createUserFeedback && (
              <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {createUserFeedback}
              </p>
            )}
            {createUserError && (
              <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {createUserError}
              </p>
            )}
          </article>

          <article className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Usuários</h2>
              <span className="text-xs text-slate-500">{loadingUsers ? 'Carregando...' : `${users.length} registros`}</span>
            </header>

            {usersError ? (
              <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {usersError}
              </p>
            ) : (
              <ul className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {users.map((listedUser) => {
                  const isSelected = listedUser.id === selectedUserId;
                  const isSelf = listedUser.id === authUser?.id;
                  const invitationStatus = resolveInvitationStatus(listedUser);
                  const draftRole = roleDraftByUser[listedUser.id] ?? normalizeRole(listedUser.role);
                  return (
                    <li
                      key={listedUser.id}
                      className={`rounded-xl border px-4 py-3 text-sm transition ${
                        isSelected
                          ? 'border-red-300 bg-red-50 text-slate-800'
                          : 'border-stone-200 bg-white text-slate-700 hover:border-red-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <button type="button" onClick={() => setSelectedUserId(listedUser.id)} className="text-left">
                          <p className="font-semibold">{listedUser.fullName ?? listedUser.email}</p>
                          <p className="text-xs text-slate-500">{listedUser.email}</p>
                          <p className="text-xs text-slate-500">
                            {(listedUser.permissionLevel === 'AdminMaster'
                              ? 'Administrador master'
                              : listedUser.permissionLevel === 'AdminUsers'
                                ? 'Administrador de usuários'
                                : roleLabels[normalizeRole(listedUser.role)] ?? normalizeRole(listedUser.role))}
                            {listedUser.blocked ? ' - Bloqueado' : ''}
                          </p>
                          {invitationStatus ? (
                            <>
                              <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${invitationClassByStatus[invitationStatus] ?? 'border-stone-300 bg-stone-100 text-stone-700'}`}>
                                {invitationLabels[invitationStatus] ?? 'Sem convite'}
                              </span>
                              {invitationStatus === 'pending' ? (
                                <p className="mt-1 text-[11px] text-amber-700">
                                  Convite enviado em {formatDateTime(listedUser.invitationSentAt) ?? 'data não registrada'}.
                                </p>
                              ) : null}
                              {invitationStatus === 'accepted' ? (
                                <p className="mt-1 text-[11px] text-emerald-700">
                                  Primeiro acesso concluído em {formatDateTime(listedUser.invitationAcceptedAt) ?? 'data não registrada'}.
                                </p>
                              ) : null}
                              {invitationStatus === 'expired' ? (
                                <p className="mt-1 text-[11px] text-rose-700">
                                  Convite expirado. Reenvie para liberar novo primeiro acesso.
                                </p>
                              ) : null}
                            </>
                          ) : null}
                        </button>
                        <div className="flex items-center gap-2">
                          <select
                            value={draftRole}
                            onChange={(event) =>
                              setRoleDraftByUser((prev) => ({
                                ...prev,
                                [listedUser.id]: event.target.value
                              }))
                            }
                            disabled={isSelf}
                            className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-slate-800"
                          >
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <Button
                            variant="secondary"
                            onClick={() => handleRoleChange(listedUser.id, draftRole)}
                            disabled={isSelf || roleLoadingId === listedUser.id || draftRole === normalizeRole(listedUser.role)}
                          >
                            {roleLoadingId === listedUser.id ? 'Atualizando...' : 'Salvar nível'}
                          </Button>
                          {resolveCanResendInvite(listedUser) ? (
                            <Button
                              variant="secondary"
                              onClick={() => handleResendInvite(listedUser)}
                              disabled={inviteLoadingId === listedUser.id}
                            >
                              {inviteLoadingId === listedUser.id ? 'Reenviando...' : 'Reenviar convite'}
                            </Button>
                          ) : null}
                          {resolveCanDelete(listedUser) ? (
                            <Button
                              variant="secondary"
                              onClick={() => handleDeleteUser(listedUser)}
                              disabled={deleteLoadingId === listedUser.id}
                            >
                              {deleteLoadingId === listedUser.id ? 'Apagando...' : 'Apagar usuário'}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {isSelf ? (
                        <p className="mt-2 text-xs text-amber-700">
                          Sua própria permissão não pode ser alterada.
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Status de acesso</h2>
              <p className="text-xs text-slate-500">
                Usuário bloqueado não consegue entrar na conta nem redefinir senha.
              </p>
            </header>

            {!selectedUser ? (
              <p className="rounded border border-stone-200 bg-white px-3 py-2 text-sm text-slate-500">
                Selecione um usuário para editar o acesso.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-stone-200 bg-white p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">{selectedUser.fullName ?? selectedUser.email}</p>
                  <p className="mt-1 text-slate-500">Status atual: {selectedUser.blocked ? 'Bloqueado' : 'Ativo'}</p>
                </div>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <span>Bloquear acesso deste usuário</span>
                  <input
                    type="checkbox"
                    checked={accessDraft.blocked}
                    onChange={(event) => setAccessDraft((prev) => ({ ...prev, blocked: event.target.checked }))}
                    className="h-4 w-4 rounded border-stone-400 bg-white text-red-600 focus:ring focus:ring-red-500/30"
                  />
                </label>

                {accessDraft.blocked && (
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span>Motivo do bloqueio (opcional)</span>
                    <input
                      type="text"
                      value={accessDraft.reason}
                      onChange={(event) => setAccessDraft((prev) => ({ ...prev, reason: event.target.value }))}
                      className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                      placeholder="Ex.: desligamento da empresa"
                    />
                  </label>
                )}

                {accessFeedback && (
                  <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {accessFeedback}
                  </p>
                )}
                {accessError && (
                  <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {accessError}
                  </p>
                )}

                <div className="flex justify-center">
                  <Button onClick={handleAccessStatusSave} disabled={accessLoading}>
                    {accessLoading ? 'Salvando...' : 'Salvar status'}
                  </Button>
                </div>
              </div>
            )}
          </article>
        </section>

        {selectedUser && normalizeRole(selectedUser.role) === 'Reader' && (
          <section className="mt-4 rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Delegação de estufas para leitor</h2>
              <p className="text-xs text-slate-500">
                Marque quais estufas o usuário leitor pode consultar.
              </p>
            </header>

            <div className="grid gap-2 sm:grid-cols-2">
              {greenhouses.map((item) => {
                const checked = readerDraft.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                      checked
                        ? 'border-red-300 bg-red-50 text-slate-800'
                        : 'border-stone-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>
                      <span className="block font-semibold">{item.nome || item.id}</span>
                      <span className="block text-xs text-slate-500">{item.cidade || '-'} / {item.estado || '-'}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleReaderGreenhouse(item.id)}
                      className="h-4 w-4 rounded border-stone-400 bg-white text-red-600 focus:ring focus:ring-red-500/30"
                    />
                  </label>
                );
              })}
            </div>

            {readerFeedback && (
              <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {readerFeedback}
              </p>
            )}
            {readerError && (
              <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {readerError}
              </p>
            )}

            <div className="mt-3 flex justify-center">
              <Button onClick={handleReaderAccessSave} disabled={readerSaving}>
                {readerSaving ? 'Salvando...' : 'Salvar delegação'}
              </Button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
