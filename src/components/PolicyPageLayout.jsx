import React from 'react';
import { Link } from 'react-router-dom';

// Estrutura base das paginas legais (termos, privacidade e cookies).
export function PolicyPageLayout({ eyebrow, title, children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(185,28,28,0.14)_0%,#120f0f_55%)] text-slate-200">
      <header className="mx-auto max-w-[720px] px-5 pb-10 pt-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{eyebrow}</p>
        <h1 className="mt-6 text-[clamp(28px,6vw,40px)] font-semibold text-slate-50">{title}</h1>
      </header>

      <main className="mx-auto grid w-[min(720px,calc(100%-40px))] gap-8 pb-16">
        {children}
      </main>

      <footer className="px-5 pb-16 pt-10 text-center">
        <Link
          className="inline-flex items-center gap-3 rounded-full border border-red-700/50 bg-red-950/30 px-7 py-3.5 font-semibold text-red-100 transition hover:border-red-500 hover:bg-red-900/40 hover:shadow-[0_12px_24px_-12px_rgba(185,28,28,0.45)]"
          to="/"
        >
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Voltar para o portal da estufa
        </Link>
      </footer>
    </div>
  );
}
