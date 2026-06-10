/**
 * ContactPage - Fale Conosco do Plantelligence.
 * Mesmo padrão visual da landing page — SaaS premium, sem dependências extras.
 */

import React, { useState } from 'react';
import { sendContactRequest } from '../api/siteService.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

const initialForm = { name: '', email: '', company: '', subject: '', message: '' };

const CONTACTS = [
  { icon: 'fa-envelope',   c: 'text-red-400',    bg: 'bg-red-500/10',    title: 'E-mail',        value: 'contato@plantelligence.cloud', href: 'mailto:contato@plantelligence.cloud' },
  { icon: 'fa-clock',      c: 'text-amber-400',  bg: 'bg-amber-500/10',  title: 'Resposta',      value: 'Em até 24 horas úteis',        href: null },
  { icon: 'fa-shield-halved', c: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Segurança', value: 'Conformidade LGPD garantida',  href: null },
];

export const ContactPage = () => {
  const [form, setForm]       = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendContactRequest(form);
      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível enviar sua mensagem. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#0c0909] py-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[360px] w-[560px] rounded-full bg-red-600/8 blur-[90px]" />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle,#ef4444 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/8 px-4 py-1.5 mb-8">
            <i className="fa-solid fa-envelope text-red-400 text-[10px]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">Fale conosco</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-white mb-5">
            Como podemos<br />
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">ajudar você?</span>
          </h1>
          <p className="text-stone-400 text-lg leading-relaxed max-w-xl mx-auto">
            Tire dúvidas sobre o Plantelligence, solicite uma demonstração ou fale com nossa equipe técnica.
          </p>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="bg-[#0f0c0c] border-t border-stone-800/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-[1fr_1.6fr] gap-12 items-start">

            {/* Coluna esquerda — info */}
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-3">Atendimento</p>
                <h2 className="text-2xl font-bold text-white mb-3">Nossa equipe está pronta para responder</h2>
                <p className="text-stone-400 text-sm leading-relaxed">
                  Seja para uma dúvida técnica, uma demonstração ou uma proposta comercial, respondemos com atenção e sem rodeios.
                </p>
              </div>

              <div className="space-y-3">
                {CONTACTS.map((c) => (
                  <div key={c.title} className="flex items-center gap-4 rounded-xl border border-stone-800/60 bg-stone-900/35 p-4">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
                      <i className={`fa-solid ${c.icon} ${c.c}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{c.title}</p>
                      {c.href
                        ? <a href={c.href} className="text-sm font-medium text-stone-200 hover:text-red-400 transition">{c.value}</a>
                        : <p className="text-sm font-medium text-stone-300">{c.value}</p>
                      }
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-stone-800/60 bg-stone-900/25 p-5">
                <p className="text-xs font-semibold text-stone-400 mb-3 uppercase tracking-wider">Também nos encontre</p>
                <div className="space-y-2 text-sm text-stone-400">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-globe text-red-400/60 text-xs" />
                    <span>plantelligence.cloud</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-brands fa-github text-stone-500 text-xs" />
                    <span>github.com/plantelligence</span>
                  </div>
                </div>
              </div>

            </div>{/* col esquerda */}

            {/* Coluna direita: formulario */}
            <div>
              {success ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-10 text-center">
                  <i className="fa-solid fa-circle-check text-3xl text-emerald-400" />
                  <p className="text-base font-semibold text-emerald-300">Mensagem enviada com sucesso!</p>
                  <p className="text-sm text-stone-400">Retornamos em ate 24 horas uteis.</p>
                  <button type="button" onClick={() => { setSuccess(false); setForm(initialForm); }}
                    className="rounded-xl border border-stone-700 px-5 py-2 text-sm text-stone-300 hover:text-white transition">
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                      <i className="fa-solid fa-circle-exclamation flex-shrink-0" /> {error}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Nome</span>
                      <input name="name" value={form.name} onChange={handleChange} required
                        placeholder="Seu nome"
                        className="rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-red-500/60 transition" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">E-mail</span>
                      <input name="email" type="email" value={form.email} onChange={handleChange} required
                        placeholder="seu@email.com"
                        className="rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-red-500/60 transition" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Empresa (opcional)</span>
                    <input name="company" value={form.company} onChange={handleChange}
                      placeholder="Nome da sua empresa ou producao"
                      className="rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-red-500/60 transition" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Assunto</span>
                    <select name="subject" value={form.subject} onChange={handleChange} required
                      className="rounded-xl border border-stone-700/60 bg-stone-800/60 px-4 py-2.5 text-sm text-stone-100 outline-none focus:border-red-500/60 transition">
                      <option value="" disabled>Selecione o assunto</option>
                      <option value="suporte">Suporte tecnico</option>
                      <option value="duvida">Duvida sobre a plataforma</option>
                      <option value="parceria">Proposta de parceria</option>
                      <option value="feedback">Feedback ou sugestao</option>
                      <option value="outro">Outro</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Mensagem</span>
                    <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                      placeholder="Descreva sua duvida, sugestao ou necessidade..."
                      className="resize-none rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-red-500/60 transition" />
                  </label>
                  <p className="text-[10px] text-stone-600">
                    Ao enviar, voce concorda com nossa{' '}
                    <a href="/privacidade" className="text-stone-500 hover:text-stone-300 underline">Politica de Privacidade</a>.
                    Nenhum dado sera compartilhado com terceiros.
                  </p>
                  <button type="submit" disabled={loading}
                    className="w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-40">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin" /> Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-paper-plane" /> Enviar mensagem
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>{/* col direita */}

          </div>{/* grid */}
        </div>{/* max-w */}
      </section>
    </div>
  );
};
