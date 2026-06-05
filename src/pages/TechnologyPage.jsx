/**
 * TechnologyPage - Landing page pública do Plantelligence.
 * Design premium SaaS com animações via IntersectionObserver nativo.
 * Stack: React + Tailwind CSS - zero dependências extras.
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

// ── Hook: scroll reveal suave ──────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('lp-revealed'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const Reveal = ({ children, className = '', delay = 0 }) => {
  const ref = useReveal();
  return (
    <div ref={ref} className={`lp-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// ── Ícone cogumelo SVG ─────────────────────────────────────────────────────────
const Shroom = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="10" rx="8" ry="6" fill="#ef4444" opacity="0.9" />
    <ellipse cx="12" cy="11" rx="7" ry="2" fill="#1a0000" opacity="0.45" />
    <rect x="9.5" y="13" width="5" height="7" rx="2" fill="#b91c1c" opacity="0.75" />
    <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.35" />
    <circle cx="14" cy="7" r="1" fill="white" opacity="0.25" />
  </svg>
);

// ── Dados ──────────────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: 'fa-temperature-half', c: 'text-red-400',    bg: 'bg-red-500/10',     title: 'Telemetria 24/7',          desc: 'Temperatura, umidade, luminosidade e substrato monitorados em tempo real com alertas automáticos em menos de 3 minutos.' },
  { icon: 'fa-sliders',          c: 'text-amber-400',  bg: 'bg-amber-500/10',   title: 'Controle Remoto IoT',      desc: 'Acione lâmpadas e nebulizadores pelo painel. Comandos Cloud-to-Device via Azure IoT Hub com confirmação instantânea.' },
  { icon: 'fa-robot',            c: 'text-blue-400',   bg: 'bg-blue-500/10',    title: 'Assistente com IA',        desc: 'Chat especializado em fungicultura. Interprete alertas, ajuste parâmetros e tome decisões com suporte inteligente.' },
  { icon: 'fa-shield-halved',    c: 'text-emerald-400',bg: 'bg-emerald-500/10', title: 'Segurança Empresarial',    desc: 'MFA obrigatório, tokens rotativos, trilha de auditoria imutável e conformidade LGPD completa.' },
  { icon: 'fa-leaf',             c: 'text-lime-400',   bg: 'bg-lime-500/10',    title: 'Perfis de Cultivo',        desc: 'Presets técnicos por espécie ou criados com IA. Faixas ideais configuráveis para cada etapa do cultivo.' },
  { icon: 'fa-users',            c: 'text-purple-400', bg: 'bg-purple-500/10',  title: 'Gestão de Equipes',        desc: 'Admin, Colaborador e Leitor. Delegue estufas específicas e mantenha rastreabilidade de todas as ações.' },
];

const STEPS = [
  { n: '01', icon: 'fa-circle-plus', title: 'Cadastre a estufa',    desc: 'Configure em minutos, adicione o ESP32 e instale o firmware gerado automaticamente.' },
  { n: '02', icon: 'fa-wifi',        title: 'Conecte os sensores',  desc: 'O ESP32 envia telemetria via MQTT para o Azure IoT Hub. Dados no painel em segundos.' },
  { n: '03', icon: 'fa-leaf',        title: 'Defina o perfil',      desc: 'Selecione um preset padrão ou crie o seu com faixas ideais para cada espécie.' },
  { n: '04', icon: 'fa-chart-line',  title: 'Monitore e automatize', desc: 'Alertas, controles remotos e IA para otimizar continuamente o microclima.' },
];

const STATS = [
  { v: '4',      l: 'métricas monitoradas',  d: 'Temperatura, umidade, luz e substrato' },
  { v: '24/7',   l: 'telemetria contínua',   d: 'Sem interrupções, em tempo real' },
  { v: '3min', l: 'detecção de desvio',    d: 'Alertas automáticos multicanal' },
  { v: '100%',   l: 'conformidade LGPD',     d: 'Auditoria completa e rastreável' },
];

// ── Componente principal ───────────────────────────────────────────────────────
export const TechnologyPage = () => {
  const user = useAuthStore((s) => s.user);
  const ctaLink  = user ? '/dashboard' : '/login';
  const ctaLabel = user ? 'Ir para o dashboard' : 'Começar agora';

  return (
    <>
      {/* Estilos de animação - inline, sem lib externa */}
      <style>{`
        .lp-reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .lp-revealed { opacity: 1; transform: none; }
        .lp-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .lp-card:hover { transform: translateY(-3px); }
        @keyframes lp-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .lp-float { animation: lp-float 4.5s ease-in-out infinite; }
        @keyframes lp-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%      { box-shadow: 0 0 28px 6px rgba(239,68,68,0.18); }
        }
        .lp-glow { animation: lp-glow 2.8s ease-in-out infinite; }
      `}</style>

      <div>

        {/* ══════════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative isolate overflow-hidden min-h-[90vh] flex items-center bg-[#0c0909]">
          {/* Grão + glow */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'radial-gradient(circle,#ef4444 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[680px] rounded-full bg-red-600/10 blur-[110px]" />

          <div className="relative mx-auto w-full max-w-7xl px-6 py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* ── Texto ── */}
              <div className="flex flex-col gap-8">
                {/* Badge */}
                <span className="w-fit inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/8 px-4 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">IoT para Fungicultura</span>
                </span>

                {/* Headline */}
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.08] tracking-tight text-white">
                    Automação e<br />
                    <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">monitoramento</span><br />
                    para estufas de<br />cogumelos.
                  </h1>
                  <p className="mt-6 text-lg leading-relaxed text-stone-400 max-w-lg">
                    Conecte sensores, monitore em tempo real e automatize o microclima ideal para cada espécie, com IA especializada e segurança empresarial.
                  </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <Link to={ctaLink}
                    className="lp-glow inline-flex items-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 active:scale-[0.98]">
                    {ctaLabel} <i className="fa-solid fa-arrow-right text-xs" />
                  </Link>
                  <Link to="/sobre-nos"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-700 px-7 py-3.5 text-sm font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white">
                    Conheça o projeto
                  </Link>
                </div>

                {/* Trust bar */}
                <p className="flex items-center gap-2 text-xs text-stone-600">
                  <i className="fa-solid fa-shield-halved text-emerald-600" />
                  Conformidade LGPD · MFA obrigatório · Azure IoT Hub · ESP32
                </p>
              </div>

              {/* ── Mockup ── */}
              <div className="hidden lg:flex justify-center">
                <div className="lp-float relative">
                  {/* Card principal */}
                  <div className="w-[400px] rounded-2xl border border-stone-700/50 bg-stone-900/85 p-5 shadow-2xl backdrop-blur">
                    <div className="flex items-center gap-3 border-b border-stone-800 pb-4 mb-4">
                      <Shroom size={22} />
                      <div>
                        <p className="text-xs font-semibold text-stone-100">Estufa do Shiitake</p>
                        <p className="text-[10px] text-stone-500">São Paulo, SP</p>
                      </div>
                      <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Online
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { l: 'Temperatura', v: '22.4°C', ic: 'fa-temperature-half', c: 'text-red-400',    ok: true,  w: '80%' },
                        { l: 'Umidade ar',  v: '87%',   ic: 'fa-droplet',          c: 'text-blue-400',   ok: true,  w: '87%' },
                        { l: 'Luminosidade',v: '340 lx', ic: 'fa-sun',             c: 'text-amber-400',  ok: true,  w: '65%' },
                        { l: 'Substrato',   v: '68%',   ic: 'fa-seedling',         c: 'text-emerald-400', ok: false, w: '58%' },
                      ].map((m) => (
                        <div key={m.l} className="rounded-xl border border-stone-700/40 bg-stone-800/50 p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-stone-500">{m.l}</span>
                            <i className={`fa-solid ${m.ic} text-[10px] ${m.c}`} />
                          </div>
                          <p className="text-base font-bold text-stone-100">{m.v}</p>
                          <div className="mt-2 h-1 rounded-full bg-stone-700/50">
                            <div className={`h-full rounded-full transition-all ${m.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: m.w }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2.5">
                      <i className="fa-solid fa-triangle-exclamation text-amber-400 text-[11px] mt-0.5" />
                      <div>
                        <p className="text-[11px] font-semibold text-amber-300">Substrato abaixo da faixa</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">Recomendação: ativar nebulizador</p>
                      </div>
                    </div>
                  </div>
                  {/* Card IA flutuante */}
                  <div className="absolute -bottom-5 -right-6 w-52 rounded-xl border border-stone-700/50 bg-stone-900/90 px-4 py-3 shadow-xl backdrop-blur">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-[8px] font-bold text-white">IA</div>
                      <span className="text-[11px] font-semibold text-stone-200">Assistente IA</span>
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed">
                      "Substrato em 68%, abaixo do ideal para Shiitake. Recomendo ativar o nebulizador por 15 minutos."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-stone-800/50 bg-[#0f0c0c]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <Reveal className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {STATS.map((s) => (
                <div key={s.l} className="lp-card text-center">
                  <p className="text-4xl font-bold bg-gradient-to-br from-red-400 to-red-600 bg-clip-text text-transparent">{s.v}</p>
                  <p className="mt-1.5 text-sm font-semibold text-stone-200">{s.l}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{s.d}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="bg-[#0c0909] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="text-center mb-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-3">Por que Plantelligence</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Tudo o que você precisa<br />para cultivar com precisão</h2>
              <p className="mt-4 text-stone-400 max-w-lg mx-auto text-base">
                Plataforma completa desenvolvida para produtores de cogumelos que querem escalar com eficiência e controle total.
              </p>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BENEFITS.map((b, i) => (
                <Reveal key={b.title} delay={i * 70}>
                  <div className="lp-card h-full rounded-2xl border border-stone-800/70 bg-stone-900/35 p-6 hover:border-stone-700/80 hover:bg-stone-900/55">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${b.bg} mb-5`}>
                      <i className={`fa-solid ${b.icon} text-lg ${b.c}`} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-stone-100 mb-2">{b.title}</h3>
                    <p className="text-sm text-stone-400 leading-relaxed">{b.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="bg-[#0f0c0c] py-24 border-t border-stone-800/40">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="text-center mb-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-3">Simples de começar</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Pronto em menos de<br />30 minutos</h2>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 90}>
                  <div className="relative h-full rounded-2xl border border-stone-800/50 bg-stone-900/25 p-6">
                    {i < STEPS.length - 1 && (
                      <div className="hidden lg:block absolute top-10 -right-2.5 w-5 h-px bg-gradient-to-r from-red-500/30 to-transparent" />
                    )}
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-[10px] font-bold text-red-500/50">{s.n}</span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/15">
                        <i className={`fa-solid ${s.icon} text-red-400`} />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-stone-100 mb-2">{s.title}</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* BENTO */}
        <section className="bg-[#0c0909] py-24 border-t border-stone-800/40">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="text-center mb-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-3">Plataforma completa</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Uma visão de tudo,<br />de qualquer lugar</h2>
            </Reveal>
            <div className="grid lg:grid-cols-3 gap-4">
              <Reveal className="lg:col-span-2">
                <div className="h-full rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                      <i className="fa-solid fa-chart-line text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-100">Telemetria em tempo real</p>
                      <p className="text-[11px] text-stone-500">Temperatura - últimas 24 horas</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {[42,58,52,74,61,79,68,85,73,88,78,91,82,76,70,84,90,86,79,88,93,87,91,95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm"
                        style={{ height: `${h}%`, background: `rgba(239,68,68,${0.3 + (h/100)*0.5})` }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-stone-700">
                    <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>24h</span>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <div className="h-full rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <i className="fa-solid fa-bell text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-stone-100">Alertas inteligentes</p>
                  </div>
                  {[
                    { t: 'warning', m: 'Umidade abaixo de 75%',    tm: '2min' },
                    { t: 'info',    m: 'Nebulizador acionado',      tm: '5min' },
                    { t: 'success', m: 'Faixa ideal restabelecida', tm: '8min' },
                  ].map((a, i) => (
                    <div key={i} className={`rounded-xl border px-3 py-2.5 text-xs ${
                      a.t === 'warning' ? 'border-amber-500/20 bg-amber-500/8 text-amber-300' :
                      a.t === 'info'    ? 'border-blue-500/20 bg-blue-500/8 text-blue-300' :
                                          'border-emerald-500/20 bg-emerald-500/8 text-emerald-300'
                    }`}>
                      <div className="flex justify-between">
                        <span className="font-medium">{a.m}</span>
                        <span className="opacity-50 text-[10px]">{a.tm}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={60}>
                <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                      <i className="fa-solid fa-sliders text-amber-400" />
                    </div>
                    <p className="text-sm font-semibold text-stone-100">Controle remoto</p>
                  </div>
                  {[
                    { l: 'Lâmpada',     ic: 'fa-lightbulb', on: true  },
                    { l: 'Nebulizador', ic: 'fa-droplet',   on: false },
                  ].map((c) => (
                    <div key={c.l} className="flex items-center justify-between rounded-xl border border-stone-700/40 bg-stone-800/40 px-4 py-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <i className={`fa-solid ${c.ic} text-sm ${c.on ? 'text-amber-400' : 'text-stone-500'}`} />
                        <span className="text-xs font-medium text-stone-300">{c.l}</span>
                      </div>
                      <div className={`relative h-5 w-9 rounded-full transition-colors ${c.on ? 'bg-red-600' : 'bg-stone-700'}`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${c.on ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={120} className="lg:col-span-2">
                <div className="h-full rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                      <i className="fa-solid fa-robot text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-100">Assistente de IA</p>
                      <p className="text-[11px] text-stone-500">Especializado em fungicultura</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Online
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-[70%] rounded-2xl rounded-br-md bg-red-700 px-4 py-2.5 text-xs text-white">
                        Qual a temperatura ideal para Shiitake na frutificação?
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-700 text-[8px] font-bold text-white">IA</div>
                      <div className="max-w-[70%] rounded-2xl rounded-bl-md border border-stone-700/50 bg-stone-800/50 px-4 py-2.5 text-xs text-stone-300">
                        Para Shiitake na frutificação, a faixa ideal é <strong className="text-stone-100">16 a 22°C</strong>. Acima de 24°C pode inibir o desenvolvimento dos primórdios.
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative overflow-hidden bg-[#0f0c0c] py-28 border-t border-stone-800/40">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[380px] w-[560px] rounded-full bg-red-600/8 blur-[90px]" />
          </div>
          <Reveal className="relative mx-auto max-w-2xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/8 px-4 py-1.5 mb-8">
              <Shroom size={16} />
              <span className="text-[11px] font-semibold text-red-400">Plantelligence</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
              Pronto para cultivar<br />com mais inteligência?
            </h2>
            <p className="text-stone-400 text-base mb-10 max-w-md mx-auto">
              Solicite o cadastro e comece a monitorar suas estufas em tempo real com a plataforma IoT especializada em fungicultura.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={ctaLink}
                className="lp-glow inline-flex items-center gap-2.5 rounded-xl bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-red-500 active:scale-[0.98]">
                {ctaLabel} <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
              <Link to="/fale-conosco"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-700 px-8 py-4 text-base font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white">
                Falar com a equipe
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600">
              <span><i className="fa-solid fa-lock mr-1.5" />Conformidade LGPD</span>
              <span><i className="fa-solid fa-shield-halved mr-1.5" />MFA obrigatório</span>
              <span><i className="fa-solid fa-cloud mr-1.5" />Azure IoT Hub</span>
              <span><i className="fa-solid fa-microchip mr-1.5" />ESP32 ready</span>
            </div>
          </Reveal>
        </section>

      </div>
    </>
  );
};
