/**
 * AboutPage - Sobre Nós do Plantelligence.
 * Mesmo padrão visual da landing page, SaaS premium, sem dependências extras.
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('ab-revealed'); obs.disconnect(); } },
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
    <div ref={ref} className={`ab-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

const Shroom = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="10" rx="8" ry="6" fill="#ef4444" opacity="0.9" />
    <ellipse cx="12" cy="11" rx="7" ry="2" fill="#1a0000" opacity="0.45" />
    <rect x="9.5" y="13" width="5" height="7" rx="2" fill="#b91c1c" opacity="0.75" />
    <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.35" />
    <circle cx="14" cy="7" r="1" fill="white" opacity="0.25" />
  </svg>
);

const VALUES = [
  { icon: 'fa-seedling',      c: 'text-lime-400',    bg: 'bg-lime-500/10',    title: 'Foco no produtor',         desc: 'Cada funcionalidade foi pensada para quem cultiva. Sem complexidade desnecessária, sem curva de aprendizado longa.' },
  { icon: 'fa-shield-halved', c: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Segurança como base',      desc: 'MFA obrigatório, trilha de auditoria e conformidade LGPD não são diferenciais, são o padrão mínimo de qualquer sistema.' },
  { icon: 'fa-bolt',          c: 'text-amber-400',   bg: 'bg-amber-500/10',   title: 'Tecnologia que funciona',  desc: 'IoT com Azure, IA especializada e alertas em tempo real. Infraestrutura robusta entregando resultados práticos no campo.' },
  { icon: 'fa-users',         c: 'text-purple-400',  bg: 'bg-purple-500/10',  title: 'Operação em equipe',       desc: 'Perfis de acesso, delegação de estufas e histórico de ações. Toda a equipe com clareza e rastreabilidade.' },
];

const PILLARS = [
  { n: '01', title: 'Automação real',       desc: 'Conectamos sensores ESP32 ao Azure IoT Hub via MQTT. O painel reflete o ambiente físico em segundos, sem intermediários.' },
  { n: '02', title: 'Inteligência aplicada', desc: 'A IA do Plantelligence é treinada em fungicultura. Não é um chatbot genérico, é um especialista disponível 24 horas.' },
  { n: '03', title: 'Controle granular',    desc: 'Lâmpadas, nebulizadores e perfis de cultivo controlados por espécie, turno e responsável. Sem ambiguidade operacional.' },
  { n: '04', title: 'Conformidade total',   desc: 'Auditoria imutável, encadeamento hash e LGPD by design. Projetado para inspeção, não apenas para funcionamento.'   },
];

export const AboutPage = () => (
  <>
    <style>{`
      .ab-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.55s ease, transform 0.55s ease; }
      .ab-revealed { opacity: 1; transform: none; }
      .ab-card { transition: transform 0.2s ease; }
      .ab-card:hover { transform: translateY(-3px); }
    `}</style>

    <div>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#0c0909] py-28">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-red-600/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle,#ef4444 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/8 px-4 py-1.5 mb-8">
              <Shroom size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">Sobre nós</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white mb-6">
              Tecnologia séria para<br />
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">estufas de cogumelos.</span>
            </h1>
            <p className="text-lg text-stone-400 leading-relaxed max-w-2xl mx-auto mb-10">
              O Plantelligence nasceu da necessidade real de produtores que precisavam de monitoramento confiável, automação acessível e uma operação que a equipe toda conseguisse usar com segurança.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/fale-conosco" className="inline-flex items-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 active:scale-[0.98]">
                Falar com a equipe <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-stone-700 px-7 py-3.5 text-sm font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white">
                Acessar o sistema
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MISSÃO */}
      <section className="bg-[#0f0c0c] border-t border-stone-800/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-4">Nossa missão</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
                Fazer a tecnologia trabalhar<br />pelo produtor, não o contrário.
              </h2>
              <p className="text-stone-400 text-base leading-relaxed mb-6">
                Produtores de cogumelos já têm trabalho suficiente: substrato, microclima, equipe, comercialização. O Plantelligence existe para tirar a carga do monitoramento e da automação das suas costas.
              </p>
              <p className="text-stone-400 text-base leading-relaxed">
                Nossa plataforma conecta sensores físicos ao painel web em segundos, dispara alertas antes que o problema vire perda e permite que qualquer membro da equipe saiba exatamente o que fazer, com rastreabilidade completa.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: '4',     l: 'métricas em tempo real', ic: 'fa-chart-line',    c: 'text-red-400' },
                  { v: '24/7',  l: 'monitoramento contínuo', ic: 'fa-satellite-dish', c: 'text-blue-400' },
                  { v: '3min',  l: 'tempo de detecção',      ic: 'fa-bolt',          c: 'text-amber-400' },
                  { v: '100%',  l: 'conformidade LGPD',      ic: 'fa-shield-halved', c: 'text-emerald-400' },
                ].map((s) => (
                  <div key={s.l} className="ab-card rounded-2xl border border-stone-800/60 bg-stone-900/40 p-5 text-center">
                    <i className={`fa-solid ${s.ic} text-xl ${s.c} mb-3 block`} />
                    <p className="text-3xl font-bold text-white">{s.v}</p>
                    <p className="text-xs text-stone-500 mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="bg-[#0c0909] py-24 border-t border-stone-800/40">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-3">O que nos guia</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Princípios que definem<br />cada decisão de produto</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 70}>
                <div className="ab-card h-full rounded-2xl border border-stone-800/70 bg-stone-900/35 p-6 hover:border-stone-700/80">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${v.bg} mb-5`}>
                    <i className={`fa-solid ${v.icon} text-lg ${v.c}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-100 mb-2">{v.title}</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="bg-[#0f0c0c] py-24 border-t border-stone-800/40">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-3">Como construímos</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Quatro pilares que sustentam<br />a plataforma</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-5">
            {PILLARS.map((p, i) => (
              <Reveal key={p.n} delay={i * 80}>
                <div className="ab-card h-full rounded-2xl border border-stone-800/50 bg-stone-900/25 p-7">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[10px] font-bold text-red-500/50">{p.n}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-red-500/20 to-transparent" />
                  </div>
                  <h3 className="text-base font-semibold text-stone-100 mb-2">{p.title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="bg-[#0c0909] py-24 border-t border-stone-800/40">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-3">Para quem é</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Feito para quem cultiva<br />com seriedade</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { ic: 'fa-building',  c: 'text-stone-400', l: 'Produtores de Shiitake',             d: 'Controle preciso de temperatura e umidade para maximizar a produtividade dos primórdios.' },
              { ic: 'fa-leaf',      c: 'text-lime-400',  l: 'Produtores de Shimeji e Champignon', d: 'Perfis técnicos por espécie com faixas configuráveis para cada etapa do ciclo.' },
              { ic: 'fa-flask',     c: 'text-blue-400',  l: 'Laboratórios e pesquisa aplicada',   d: 'Dados auditáveis, rastreabilidade completa e integração com sensores especializados.' },
              { ic: 'fa-handshake', c: 'text-purple-400',l: 'Cooperativas agrícolas',             d: 'Múltiplas estufas, múltiplas equipes, um único painel. Delegação por membro e por estufa.' },
              { ic: 'fa-industry',  c: 'text-amber-400', l: 'Unidades indoor',                    d: 'Automação de atuadores, alertas proativos e assistente de IA disponível a qualquer hora.' },
              { ic: 'fa-chart-bar', c: 'text-red-400',   l: 'Operações em escala',                d: 'Relatórios de produção, logs de auditoria e conformidade LGPD para operações profissionais.' },
            ].map((item) => (
              <Reveal key={item.l}>
                <div className="ab-card h-full rounded-2xl border border-stone-800/60 bg-stone-900/30 p-6 hover:border-stone-700/70">
                  <div className="flex items-center gap-3 mb-3">
                    <i className={`fa-solid ${item.ic} text-base ${item.c}`} />
                    <h3 className="text-sm font-semibold text-stone-100">{item.l}</h3>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{item.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#0f0c0c] py-28 border-t border-stone-800/40">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[380px] w-[560px] rounded-full bg-red-600/8 blur-[90px]" />
        </div>
        <Reveal className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
            Conheça o Plantelligence<br />na prática
          </h2>
          <p className="text-stone-400 text-base mb-10 max-w-md mx-auto">
            Fale com nossa equipe, tire suas dúvidas e entenda como a plataforma se adapta à sua operação.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/fale-conosco" className="inline-flex items-center gap-2.5 rounded-xl bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-red-500 active:scale-[0.98]">
              Falar com a equipe <i className="fa-solid fa-arrow-right text-xs" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-stone-700 px-8 py-4 text-base font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white">
              Acessar o sistema
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600">
            <span><i className="fa-solid fa-lock mr-1.5" />Conformidade LGPD</span>
            <span><i className="fa-solid fa-shield-halved mr-1.5" />MFA obrigatório</span>
            <span><i className="fa-solid fa-cloud mr-1.5" />Azure IoT Hub</span>
          </div>
        </Reveal>
      </section>

    </div>
  </>
);
