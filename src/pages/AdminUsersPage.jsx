// Painel administrativo para gerenciar usuários: listar, criar, editar e remover contas.
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import {
  getUsers,
  createUserByAdmin,
  updateUserRole,
  getUserGreenhouseConfig,
  updateGreenhouseTeam
} from '../api/adminService.js';
import { getUserPermissions, updateUserPermissions } from '../api/permissionsService.js';
import { useAuthStore } from '../store/authStore.js';

const roleLabels = {
  Admin: 'Administrador',
  User: 'Operador'
};

const defaultPermissions = {
  canViewTelemetry: true,
  canViewAlerts: true,
  canControlActuators: false,
  canEditGreenhouseParameters: false,
  canManageTeam: false
};

export const AdminUsersPage = () => {
  const authUser = useAuthStore((state) => state.user);
  const updateUserStore = useAuthStore((state) => state.updateUser);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [teamSelection, setTeamSelection] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamFeedback, setTeamFeedback] = useState(null);
  const [teamError, setTeamError] = useState(null);

  const [roleFeedback, setRoleFeedback] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [roleLoadingId, setRoleLoadingId] = useState(null);
  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    role: 'User'
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserFeedback, setCreateUserFeedback] = useState(null);
  const [createUserError, setCreateUserError] = useState(null);
  const [createUserEndpointReady, setCreateUserEndpointReady] = useState(true);
  const [permissionDraft, setPermissionDraft] = useState(defaultPermissions);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionFeedback, setPermissionFeedback] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [permissionsEndpointReady, setPermissionsEndpointReady] = useState(true);

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      setLoadingUsers(true);
      setUsersError(null);
      try {
        const result = await getUsers();
        if (!active) {
          return;
        }
        const fetchedUsers = result?.users ?? [];
        setUsers(fetchedUsers);
        if (fetchedUsers.length > 0) {
          setSelectedUserId((prev) => prev ?? fetchedUsers[0].id);
        }
      } catch (error) {
        if (active) {
          setUsersError(error.response?.data?.message ?? 'Não foi possível listar usuários.');
        }
      } finally {
        if (active) {
          setLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const adminCount = useMemo(
    () => users.filter((entry) => entry.role === 'Admin').length,
    [users]
  );
  const operatorCount = useMemo(
    () => users.filter((entry) => entry.role !== 'Admin').length,
    [users]
  );

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedConfig(null);
      setTeamSelection([]);
      return;
    }

    let active = true;
    const loadConfig = async () => {
      setTeamLoading(true);
      setTeamError(null);
      setTeamFeedback(null);
      try {
        const result = await getUserGreenhouseConfig(selectedUserId);
        if (!active) {
          return;
        }
        const config = result?.config ?? null;
        setSelectedConfig(config);
        const watcherIds = (config?.watchers ?? []).filter((watcherId) => watcherId !== selectedUserId);
        setTeamSelection(watcherIds);
      } catch (error) {
        if (active) {
          setTeamError(error.response?.data?.message ?? 'Falha ao carregar equipe da estufa.');
        }
      } finally {
        if (active) {
          setTeamLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      active = false;
    };
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      setPermissionDraft(defaultPermissions);
      setPermissionFeedback(null);
      setPermissionError(null);
      return;
    }

    let active = true;

    const loadPermissions = async () => {
      setPermissionLoading(true);
      setPermissionFeedback(null);
      setPermissionError(null);

      try {
        const result = await getUserPermissions(selectedUserId);
        if (!active) {
          return;
        }

        setPermissionsEndpointReady(true);
        setPermissionDraft({
          ...defaultPermissions,
          ...(result?.permissions ?? {})
        });
      } catch (_error) {
        if (!active) {
          return;
        }

        setPermissionsEndpointReady(false);
        setPermissionDraft(defaultPermissions);
        setPermissionFeedback('Não foi possível carregar as permissões do usuário.');
      } finally {
        if (active) {
          setPermissionLoading(false);
        }
      }
    };

    loadPermissions();

    return () => {
      active = false;
    };
  }, [selectedUserId]);

  const toggleWatcher = (watcherId) => {
    setTeamFeedback(null);
    setTeamError(null);
    setTeamSelection((prev) => {
      if (prev.includes(watcherId)) {
        return prev.filter((id) => id !== watcherId);
      }
      return [...prev, watcherId];
    });
  };

  const handleRoleChange = async (userId, nextRole) => {
    setRoleFeedback(null);
    setRoleError(null);
    setRoleLoadingId(userId);
    try {
      const result = await updateUserRole({ userId, role: nextRole });
      const updatedUser = result?.user ?? null;
      if (updatedUser) {
        setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
        if (authUser?.id === updatedUser.id) {
          updateUserStore(updatedUser);
        }
        setRoleFeedback(
          nextRole === 'Admin'
            ? `${updatedUser.email} agora é administrador.`
            : `${updatedUser.email} agora é operador.`
        );
      }
    } catch (error) {
      setRoleError(error.response?.data?.message ?? 'Não foi possível atualizar a função.');
    } finally {
      setRoleLoadingId(null);
    }
  };

  const handleTeamSave = async () => {
    if (!selectedUserId) {
      return;
    }
    setTeamFeedback(null);
    setTeamError(null);
    setTeamLoading(true);
    try {
      const result = await updateGreenhouseTeam({
        userId: selectedUserId,
        watcherIds: teamSelection
      });
      const updatedConfig = result?.config ?? null;
      setSelectedConfig(updatedConfig);
      const watcherIds = (updatedConfig?.watchers ?? []).filter((id) => id !== selectedUserId);
      setTeamSelection(watcherIds);
      setTeamFeedback('Equipe de resposta a alertas atualizada com sucesso.');
    } catch (error) {
      setTeamError(error.response?.data?.message ?? 'Falha ao atualizar equipe de alertas.');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCreateUserChange = (event) => {
    const { name, value } = event.target;
    setCreateUserForm((prev) => ({ ...prev, [name]: value }));
    setCreateUserFeedback(null);
    setCreateUserError(null);
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
      const result = await createUserByAdmin({
        fullName,
        email,
        role: createUserForm.role
      });

      const createdUser = result?.user ?? null;
      if (createdUser) {
        setUsers((prev) => {
          const exists = prev.some((entry) => entry.id === createdUser.id);
          if (exists) {
            return prev.map((entry) => (entry.id === createdUser.id ? createdUser : entry));
          }
          return [createdUser, ...prev];
        });
        setSelectedUserId(createdUser.id);
      }

      setCreateUserEndpointReady(true);
      setCreateUserForm({
        fullName: '',
        email: '',
        role: 'User'
      });
      setCreateUserFeedback('Usuário criado com sucesso.');
    } catch (_error) {
      setCreateUserEndpointReady(false);
      setCreateUserError('Não foi possível criar o usuário. Verifique os dados e tente novamente.');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const togglePermission = (permissionKey) => {
    setPermissionFeedback(null);
    setPermissionError(null);
    setPermissionDraft((prev) => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
  };

  const handlePermissionsSave = async () => {
    if (!selectedUserId) {
      return;
    }

    setPermissionSaving(true);
    setPermissionFeedback(null);
    setPermissionError(null);

    try {
      const result = await updateUserPermissions(selectedUserId, {
        permissions: permissionDraft
      });
      setPermissionsEndpointReady(true);
      setPermissionDraft({
        ...defaultPermissions,
        ...(result?.permissions ?? permissionDraft)
      });
      setPermissionFeedback('Permissões granulares atualizadas com sucesso.');
    } catch (_error) {
      setPermissionsEndpointReady(false);
      setPermissionError('Não foi possível salvar as permissões. Tente novamente.');
    } finally {
      setPermissionSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
        <header className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Administração do Sistema</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">Usuários, permissões e equipes</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gerencie o acesso à plataforma e os responsáveis por alertas operacionais das estufas.
          </p>

          <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-xs text-slate-600">
            <p className="font-semibold uppercase tracking-[0.15em] text-slate-700">Legenda de permissionamento</p>
            <ul className="mt-2 space-y-1">
              <li>
                <span className="font-semibold text-slate-800">Administrador:</span> gerencia usuários e permissões, visualiza logs de segurança e configura equipes de alertas.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Operador:</span> acessa painel, estufas e configurações pessoais, sem acesso a funções administrativas.
              </li>
            </ul>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Contas ativas</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{users.length}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Administradores</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{adminCount}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Operadores</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{operatorCount}</p>
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
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          <article className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6 lg:col-span-2">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Criar usuário</h2>
              <p className="text-xs text-slate-500">
                O administrador pode cadastrar contas diretamente e definir o papel inicial de acesso.
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
                <span>Papel</span>
                <select
                  name="role"
                  value={createUserForm.role}
                  onChange={handleCreateUserChange}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="User">Operador</option>
                  <option value="Admin">Administrador</option>
                </select>
              </label>
              <div className="flex items-end">
                <Button type="submit" disabled={createUserLoading} className="w-full">
                  {createUserLoading ? 'Criando...' : 'Criar usuário'}
                </Button>
              </div>
            </form>

            {createUserFeedback ? (
              <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {createUserFeedback}
              </p>
            ) : null}

            {createUserError ? (
              <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {createUserError}
              </p>
            ) : null}

          </article>

          <article className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Usuários e permissões</h2>
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
                  const isAdmin = listedUser.role === 'Admin';
                  const nextRole = isAdmin ? 'User' : 'Admin';
                  const roleButtonLabel = isAdmin ? 'Definir como operador' : 'Definir como admin';
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
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(listedUser.id)}
                          className="text-left"
                        >
                          <p className="font-semibold">{listedUser.fullName ?? listedUser.email}</p>
                          <p className="text-xs text-slate-500">{listedUser.email}</p>
                          <p className="text-xs text-slate-500">{roleLabels[listedUser.role] ?? listedUser.role}</p>
                        </button>
                        <Button
                          variant="secondary"
                          onClick={() => handleRoleChange(listedUser.id, nextRole)}
                          disabled={roleLoadingId === listedUser.id}
                        >
                          {roleLoadingId === listedUser.id ? 'Atualizando...' : roleButtonLabel}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Equipes e alertas</h2>
              <p className="text-xs text-slate-500">
                Defina quem recebe alertas quando sensores ou atuadores saem da faixa esperada.
              </p>
            </header>
            {!selectedUser ? (
              <p className="rounded border border-stone-200 bg-white px-3 py-2 text-sm text-slate-500">
                Selecione um usuário para configurar a equipe de resposta.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-200 bg-white p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">{selectedUser.fullName ?? selectedUser.email}</p>
                  <p className="mt-1 text-slate-500">
                    {selectedConfig?.name
                      ? `Estufa cadastrada: ${selectedConfig.name}`
                      : 'Estufa ainda não configurada para este usuário.'}
                  </p>
                </div>
                {teamError && (
                  <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {teamError}
                  </p>
                )}
                {teamFeedback && (
                  <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {teamFeedback}
                  </p>
                )}
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {users
                    .filter((candidate) => candidate.id !== selectedUser.id)
                    .map((candidate) => {
                      const checked = teamSelection.includes(candidate.id);
                      return (
                        <label
                          key={candidate.id}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                            checked
                              ? 'border-red-300 bg-red-50 text-slate-800'
                              : 'border-stone-200 bg-white text-slate-700 hover:border-red-200'
                          }`}
                        >
                          <span>
                            <span className="block font-semibold">{candidate.fullName ?? candidate.email}</span>
                            <span className="block text-xs text-slate-500">{candidate.email}</span>
                          </span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-stone-400 bg-white text-red-600 focus:ring focus:ring-red-500/30"
                            checked={checked}
                            onChange={() => toggleWatcher(candidate.id)}
                          />
                        </label>
                      );
                    })}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={handleTeamSave} disabled={teamLoading}>
                    {teamLoading ? 'Salvando...' : 'Aplicar equipe técnica'}
                  </Button>
                  <span className="text-xs text-slate-500">
                    O titular da estufa permanece incluído automaticamente.
                  </span>
                </div>
                {selectedConfig?.watchersDetails?.length > 0 ? (
                  <div className="rounded-xl border border-stone-200 bg-white p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Equipe atual</p>
                    <ul className="mt-2 space-y-1">
                      {selectedConfig.watchersDetails.map((detail) => (
                        <li key={detail.id} className="flex items-center justify-between">
                          <span>{detail.fullName ?? detail.email}</span>
                          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            {roleLabels[detail.role] ?? detail.role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="rounded border border-stone-200 bg-white px-3 py-2 text-xs text-slate-500">
                    Nenhum integrante adicional está configurado para resposta a alertas.
                  </p>
                )}
              </div>
            )}
          </article>
        </section>

        <section className="mt-4 rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Permissões granulares</h2>
            <p className="text-xs text-slate-500">
              Controle fino do que o perfil operador pode visualizar ou executar em cada conta.
            </p>
          </header>

          {!selectedUser ? (
            <p className="rounded border border-stone-200 bg-white px-3 py-2 text-sm text-slate-500">
              Selecione um usuário para editar permissões granulares.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-white p-3 text-xs text-slate-600">
                Usuário selecionado: <strong className="text-slate-800">{selectedUser.fullName ?? selectedUser.email}</strong>
              </div>

              {permissionFeedback ? (
                <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {permissionFeedback}
                </p>
              ) : null}

              {permissionError ? (
                <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {permissionError}
                </p>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ['canViewTelemetry', 'Ver telemetria da estufa'],
                  ['canViewAlerts', 'Ver alertas e notificações'],
                  ['canControlActuators', 'Controlar atuadores'],
                  ['canEditGreenhouseParameters', 'Editar parâmetros da estufa'],
                  ['canManageTeam', 'Gerenciar equipe de alertas']
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(permissionDraft[key])}
                      onChange={() => togglePermission(key)}
                      className="h-4 w-4 rounded border-stone-400 bg-white text-red-600 focus:ring focus:ring-red-500/30"
                      disabled={permissionLoading}
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handlePermissionsSave} disabled={permissionSaving || permissionLoading}>
                  {permissionSaving ? 'Salvando...' : 'Salvar permissões'}
                </Button>
                {!permissionsEndpointReady ? (
                  <span className="text-xs text-rose-700">Falha ao sincronizar permissões com o backend.</span>
                ) : (
                  <span className="text-xs text-slate-500">Permissões sincronizadas com backend.</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
