import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

const heroHighlights = [
  {
    label: '4 métricas',
    description: 'Temperatura, umidade, luminosidade e umidade do substrato em tempo real.'
  },
  {
    label: '24/7',
    description: 'Telemetria contínua para manter o microclima ideal da fungicultura.'
  },
  {
    label: '3 min',
    description: 'Detecção rápida de desvios críticos com resposta automatizada.'
  }
];

const differentiators = [
  {
    id: 'automacao',
    title: 'Automação centrada na fungicultura',
    body: 'Presets técnicos de cultivo coordenam bomba, válvula solenoide, iluminação AgroLED e exaustão com base na telemetria da estufa de cogumelos.'
  },
  {
    id: 'tecnologia',
    title: 'Arquitetura IoT Plantelligence',
    body: 'Sensoriamento no campo, processamento no backend e painel web unificado. Sincronize comandos, eventos e recomendações operacionais em um único dashboard.'
  },
  {
    id: 'lgpd',
    title: 'Segurança e LGPD por design',
    body: 'Criptografia ponta a ponta, MFA obrigatório e trilha imutável de auditoria garantem rastreabilidade do acesso de demonstração até cada acionamento da estufa.'
  }
];

const solutionBlocks = [
  {
    title: 'Controle ambiental de precisão',
    points: [
      'Faixas técnicas por espécie de cogumelo para temperatura, umidade e luminosidade.',
      'Ajustes automáticos de irrigação/substrato com base em leituras de sensores.',
      'Simulação de eventos para validar estratégias antes da operação em campo.'
    ]
  },
  {
    title: 'Orquestração inteligente de atuadores',
    points: [
      'Sincronização entre bomba, válvula solenoide, exaustão e AgroLED.',
      'Alertas técnicos com suporte à intervenção manual e rotinas automáticas.',
      'Dashboard em tempo real para decisão operacional por estufa.'
    ]
  },
  {
    title: 'Confiabilidade operacional',
    points: [
      'Autenticação multifator e tokens rotativos monitoram acessos críticos.',
      'Logs encadeados com hash prontos para auditoria e conformidade LGPD.',
      'Arquitetura segura para integração com controladores e gateways IoT.'
    ]
  }
];

const partners = [
  'Produtores de shiitake',
  'Produtores de shimeji',
  'Produtores de champignon',
  'Unidades de fungicultura indoor',
  'Cooperativas agrícolas especializadas',
  'Laboratórios de pesquisa aplicada'
];

export const TechnologyPage = () => {
  const user = useAuthStore((state) => state.user);
  const dashboardLink = user ? '/dashboard' : '/login';

  return (
  <div className="flex flex-col gap-24">
    <section id="inicio" className="relative isolate overflow-hidden bg-gradient-to-b from-red-500/15 via-slate-950 to-slate-950 pt-24">
      <div className="absolute inset-0 -z-10 opacity-40 blur-3xl" aria-hidden>
        <div className="mx-auto h-full max-w-5xl bg-red-500/30" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="max-w-xl space-y-6 lg:max-w-none">
          <span className="inline-flex items-center rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-widest text-red-200">
            Tecnologia Plantelligence
          </span>
          <h1 className="text-4xl font-bold leading-tight text-slate-50 sm:text-5xl">
            Automação e monitoramento inteligente para estufas de cogumelos.
          </h1>
          <p className="text-lg text-slate-300">
            Com telemetria contínua e orquestração de atuadores, a plataforma mantém variáveis ambientais em níveis ideais para cultivo de cogumelos. O ambiente inclui autenticação multifator, trilha de auditoria e conformidade LGPD.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={dashboardLink}
              className="rounded-md bg-red-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400"
            >
              {user ? 'Ir para o dashboard' : 'Acessar dashboard técnico'}
            </Link>
            {!user ? (
              <Link
                to="/register"
                className="rounded-md border border-red-400/60 px-5 py-3 text-center text-sm font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100"
              >
                Acesso de demonstração
              </Link>
            ) : null}
          </div>
        </div>
        <div className="w-full rounded-2xl border border-red-500/20 bg-slate-900/60 p-7 shadow-2xl shadow-red-500/20">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-red-300">
            Indicadores técnicos da plataforma
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 sm:auto-rows-fr">
            {heroHighlights.map((item) => (
              <div key={item.label} className="flex h-full flex-col rounded-md border border-slate-800 bg-slate-900/70 p-4">
                <p className="whitespace-nowrap text-xl font-semibold leading-tight text-red-400 md:text-2xl">{item.label}</p>
                <p className="mt-3 break-words text-sm leading-relaxed text-red-200">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section id="automacao" className="mx-auto w-full max-w-6xl px-6">
      <div className="grid gap-8 lg:grid-cols-3">
        {differentiators.map((item) => (
          <article
            key={item.title}
            id={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg transition hover:border-red-500/50 hover:shadow-red-500/10"
          >
            <h3 className="text-xl font-semibold text-slate-100">{item.title}</h3>
            <p className="mt-3 text-sm text-slate-400">{item.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section id="tecnologia" className="bg-slate-900/60 py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Plataforma completa para operação remota de estufas de cogumelos</h2>
            <p className="text-base text-slate-300">
              Centralize monitoramento ambiental, alertas e automação de atuadores em uma única interface. Plantelligence combina dados em tempo real com recomendações inteligentes para estabilidade do cultivo e previsibilidade operacional.
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              {partners.map((partner) => (
                <div
                  key={partner}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-center text-sm text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-100"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-slate-950 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-red-200">Como entregamos resultado operacional</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-red-400" />
                <span>Presets de cultivo por espécie com limites ambientais recomendados.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-red-400" />
                <span>Leitura consolidada de sensores e status de atuadores em tempo real.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-red-400" />
                <span>Alertas e rastreabilidade completa para reduzir risco operacional na estufa.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="lgpd" className="mx-auto w-full max-w-6xl px-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {solutionBlocks.map((block) => (
          <article key={block.title} className="rounded-3xl border border-red-500/30 bg-slate-900/80 p-8 shadow-xl shadow-red-500/10">
            <h3 className="text-xl font-semibold text-red-300">{block.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {block.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-red-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>

    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="flex flex-col gap-6 rounded-3xl border border-red-500/30 bg-slate-900/80 p-10 text-center shadow-xl shadow-red-500/10">
        <h2 className="text-3xl font-semibold text-slate-50">Veja Plantelligence operando ao vivo</h2>
        <p className="text-base text-slate-300">
          Acompanhe uma estufa de cogumelos em operação com telemetria em tempo real, controle remoto de atuadores e recomendações assistidas por IA para ajuste de parâmetros ambientais.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="rounded-md bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400"
          >
            Entrar no ambiente com MFA
          </Link>
          <Link
            to="/dashboard"
            className="rounded-md border border-red-400/60 px-5 py-3 text-sm font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100"
          >
            Abrir dashboard (se já autenticado)
          </Link>
        </div>
      </div>
    </section>
  </div>
  );
};
