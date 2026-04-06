import React, { useState } from 'react';
import { sendContactRequest } from '../api/siteService.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

const initialForm = {
  name: '',
  email: '',
  company: '',
  subject: '',
  message: ''
};

export const ContactPage = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const result = await sendContactRequest({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        company: form.company.trim(),
        subject: form.subject.trim(),
        message: form.message.trim()
      });
      setFeedback(result?.message || 'Mensagem enviada com sucesso.');
      setForm(initialForm);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível enviar sua mensagem agora.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14">
      <section className="grid gap-8 rounded-3xl border border-red-500/30 bg-gradient-to-br from-slate-950 via-slate-950 to-red-950/20 p-8 shadow-2xl shadow-red-900/20 md:grid-cols-[0.8fr_1.2fr]">
        <aside>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Fale conosco</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-50">Agende uma consultoria</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Podemos te apoiar com treinamento de uso da plataforma, implementação dos dispositivos IoT na sua organização e orçamento completo da operação.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">
            <p className="font-semibold text-red-300">Canal direto</p>
            <p className="mt-2">contato@plantelligence.cloud</p>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Seu nome"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400"
              required
              minLength={2}
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Seu e-mail"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <input
            type="text"
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Nome da empresa"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400"
          />
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Assunto"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400"
            required
            minLength={3}
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Conte rapidamente o que voce precisa"
            rows={6}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400"
            required
            minLength={10}
          />

          {feedback ? (
            <p className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{feedback}</p>
          ) : null}
          {error ? (
            <p className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Enviando...' : 'Enviar mensagem'}
          </button>
        </form>
      </section>
    </div>
  );
};
