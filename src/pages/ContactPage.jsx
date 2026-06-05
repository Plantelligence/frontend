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
                  Seja para uma dúvida técnica, uma demonstração ou uma proposta comercial — respondemos com atenção e sem rodeios.
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
                    <i className="fa-solid fa-seedling text-lime-500 w-4 text-center" />
                    <span>Especialistas em fungicultura IoT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-cloud text-blue-500 w-4 text-center" />
                    <span>Infraestrutura Azure IoT Hub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-lock text-emerald-500 w-4 text-center" />
                    <span>Conformidade LGPD garantida</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita — formulário */}
            <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-8">
              {success ? (
                <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20">
                    <i className="fa-solid fa-check text-2xl text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-stone-100 mb-2">Mensagem enviada!</p>
                    <p className="text-sm text-stone-400">Nossa equipe retornará em até 24 horas úteis.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="rounded-xl border border-stone-700 px-6 py-2.5 text-sm font-medium text-stone-300 hover:border-stone-500 hover:text-white transition"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <p className="text-base font-semibold text-stone-100 mb-1">Envie uma mensagem</p>
                    <p className="text-xs text-stone-500">Todos os campos são obrigatórios, exceto empresa.</p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                      <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />{error}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">Nome</span>
                      <input name="name" value={form.name} onChange={handleChange} required placeholder="Seu nome completo"
                        className="rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">E-mail</span>
                      <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="seu@email.com"
                        className="rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20" />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">Empresa <span className="normal-case text-stone-600">(opcional)</span></span>
                    <input name="company" value={form.company} onChange={handleChange} placeholder="Nome da empresa ou operação"
                      className="rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20" />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">Assunto</span>
                    <select name="subject" value={form.subject} onChange={handleChange} required
                      className="rounded-xl border border-stone-700/60 bg-stone-800/60 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20">
                      <option value="" className="bg-stone-900">Selecione um assunto</option>
                      <option value="Demonstração do produto" className="bg-stone-900">Demonstração do produto</option>
                      <option value="Dúvida técnica" className="bg-stone-900">Dúvida técnica</option>
                      <option value="Suporte e implantação" className="bg-stone-900">Suporte e implantação</option>
                      <option value="Proposta comercial" className="bg-stone-900">Proposta comercial</option>
                      <option value="Outro" className="bg-stone-900">Outro</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">Mensagem</span>
                    <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                      placeholder="Descreva sua dúvida, necessidade ou proposta..."
                      className="rounded-xl border border-stone-700/60 bg-stone-800/50 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 resize-none" />
                  </label>

                  <button type="submit" disabled={loading}
                    className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                    {loading
                      ? <><i className="fa-solid fa-circle-notch fa-spin mr-2" />Enviando...</>
                      : <><i className="fa-solid fa-paper-plane mr-2" />Enviar mensagem</>
                    }
                  </button>

                  <p className="text-center text-[10px] text-stone-600">
                    <i className="fa-solid fa-lock mr-1" />Seus dados são protegidos conforme a LGPD.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
