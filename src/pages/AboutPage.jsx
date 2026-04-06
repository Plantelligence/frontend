import React from 'react';
import { Link } from 'react-router-dom';

const cardClass = 'rounded-3xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-[0_24px_48px_-16px_rgba(185,28,28,0.22)]';

export const AboutPage = () => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-600/12 via-slate-950 to-slate-950 p-6 shadow-2xl shadow-red-900/20 sm:p-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-red-300">SOBRE NÓS</p>
        <h1 className="mt-3 text-center text-3xl font-semibold leading-tight text-slate-50 sm:text-5xl">Tecnologia simples para estufas de verdade</h1>
        <p className="mx-auto mt-4 max-w-4xl text-center text-base leading-relaxed text-slate-300">
          Somos uma empresa especializada em automação de estufas para microempresas. Nossa missão é facilitar o dia a dia de quem cultiva, com monitoramento claro, ações automáticas e uma operação segura para toda a equipe.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="rounded-md bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400">
            Criar meu ambiente
          </Link>
          <Link to="/fale-conosco" className="rounded-md border border-red-400/60 px-5 py-3 text-sm font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100">
            Falar com especialista
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3 md:items-stretch">
        <article className={`${cardClass} flex h-full flex-col text-center`}>
          <h2 className="text-lg font-semibold text-red-300">O que fazemos</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Automatizamos o controle de estufas com sensores e atuadores IoT para reduzir perda, melhorar estabilidade e apoiar decisões rápidas.
          </p>
        </article>
        <article className={`${cardClass} flex h-full flex-col text-center`}>
          <h2 className="text-lg font-semibold text-red-300">Para quem</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Atendemos micro e pequenas operações que precisam de tecnologia acessível, treinamento prático e implantação com suporte próximo.
          </p>
        </article>
        <article className={`${cardClass} flex h-full flex-col text-center`}>
          <h2 className="text-lg font-semibold text-red-300">Como ajudamos</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Organizamos seu ambiente com perfil de administrador, delegação de acessos para funcionários e rotina operacional clara em uma única plataforma.
          </p>
        </article>
      </section>
    </div>
  );
};
