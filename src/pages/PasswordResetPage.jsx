import React, { useState } from 'react';
import { InputField } from '../components/InputField.jsx';
import { Button } from '../components/Button.jsx';
import {
  requestPasswordReset,
  confirmPasswordReset
} from '../api/authService.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

export const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [requestFeedback, setRequestFeedback] = useState(null);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await requestPasswordReset({ email });
      setRequestFeedback({
        message: result.message ?? 'Se o e-mail existir, enviaremos instruções de recuperação.'
      });
    } catch (error) {
      setRequestFeedback({
        message: getFriendlyErrorMessage(error, 'Não foi possível processar sua solicitação agora.')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await confirmPasswordReset({ token, newPassword });
      setResetFeedback({ message: result.message });
    } catch (error) {
      setResetFeedback({
        message: getFriendlyErrorMessage(error, 'Token invalido ou expirado. Solicite um novo token.')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 rounded-2xl border border-stone-700 bg-[#171112] p-8 shadow-xl md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <header>
          <h1 className="text-xl font-semibold text-slate-100">Recuperar acesso operacional</h1>
          <p className="mt-2 text-sm text-slate-400">
            Informe o e-mail cadastrado para receber um link de redefinição de senha do console de monitoramento.
          </p>
        </header>
        <form className="flex flex-col gap-4" onSubmit={handleRequest}>
          <InputField
            label="E-mail cadastrado"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Processando...' : 'Solicitar token de recuperação'}
          </Button>
        </form>
        {requestFeedback && (
          <div className="rounded-md border border-red-500/50 bg-red-500/12 p-4 text-sm text-red-100">
            <p>{requestFeedback.message}</p>
          </div>
        )}
      </section>
      <section className="flex flex-col gap-4">
        <header>
          <h2 className="text-xl font-semibold text-slate-100">Definir nova senha</h2>
          <p className="mt-2 text-sm text-slate-400">
            Utilize o token recebido por e-mail para redefinir o acesso ao ambiente de monitoramento.
          </p>
        </header>
        <form className="flex flex-col gap-4" onSubmit={handleReset}>
          <InputField
            label="Token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
          <InputField
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Processando...' : 'Redefinir senha'}
          </Button>
        </form>
        {resetFeedback && (
          <div className="rounded-md border border-slate-700 bg-slate-800/60 p-4 text-sm text-slate-300">
            {resetFeedback.message}
          </div>
        )}
      </section>
    </div>
  );
};
