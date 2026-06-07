/**
 * CookiesPage - Política de Cookies do Plantelligence.
 * Design premium SaaS.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const SectionCard = ({ number, title, icon, children }) => (
  <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-6 hover:border-stone-700/80 transition-all">
    <div className="flex items-start gap-4 mb-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
        <i className={`fa-solid ${icon} text-red-400 text-sm`} />
      </div>
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500">{number}</span>
        <h2 className="text-base font-semibold text-stone-100 mt-0.5">{title}</h2>
      </div>
    </div>
    <div className="text-sm text-stone-400 leading-relaxed space-y-3 ml-14">{children}</div>
  </div>
);

const CookieRow = ({ name, purpose, duration, essential }) => (
  <div className="rounded-xl border border-stone-800/40 bg-stone-800/30 p-3">
    <div className="flex items-start justify-between gap-2 mb-1">
      <span className="text-xs font-semibold text-stone-200 font-mono">{name}</span>
      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${essential ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
        {essential ? 'Essencial' : 'Analitico'}
      </span>
    </div>
    <p className="text-[11px] text-stone-500">{purpose}</p>
    <p className="text-[10px] text-stone-600 mt-1">Duração: {duration}</p>
  </div>
);

export function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#0c0909] text-stone-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-red-600/6 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'radial-gradient(circle,#ef4444 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <header className="relative mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/8 px-4 py-1.5 mb-6">
          <i className="fa-solid fa-cookie-bite text-red-400 text-[11px]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">Política de Cookies</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">Política de Cookies</h1>
        <p className="text-stone-400 text-base leading-relaxed max-w-2xl mx-auto">Como o Plantelligence utiliza cookies para manter a plataforma segura, funcional e rastreável.</p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-calendar text-stone-600" /> Vigente: 26/11/2025</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-building text-stone-600" /> Plantelligence</span>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pb-20 space-y-4">

        <SectionCard number="01" title="O que são cookies" icon="fa-cookie">
          <p>Cookies são pequenos arquivos de texto armazenados pelo navegador para manter sessões seguras, lembrar preferências e possibilitar funcionalidades como autenticação persistente.</p>
          <p>Sem cookies essenciais, o login, o painel de telemetria e o modo escuro não funcionam corretamente.</p>
        </SectionCard>

        <SectionCard number="02" title="Cookies que utilizamos" icon="fa-list-check">
          <div className="space-y-2">
            <CookieRow
              name="access_token"
              purpose="Token JWT de autenticação. Mantém o usuário logado entre navegações."
              duration="Sessão (ou até o logout)"
              essential
            />
            <CookieRow
              name="refresh_token"
              purpose="Token de renovação do JWT. Permite manter a sessão ativa sem novo login."
              duration="30 dias"
              essential
            />
            <CookieRow
              name="theme_preference"
              purpose="Salva a preferência de tema claro ou escuro do usuário."
              duration="1 ano"
              essential
            />
            <CookieRow
              name="plantelligence-cookie-consent"
              purpose="Registra a escolha de consentimento de cookies do usuário."
              duration="1 ano"
              essential
            />
            <CookieRow
              name="_analytics"
              purpose="Métricas anônimas de uso (páginas visitadas, tempo de sessão). Ativado apenas com consentimento."
              duration="90 dias"
              essential={false}
            />
          </div>
        </SectionCard>

        <SectionCard number="03" title="Cookies de terceiros" icon="fa-share-nodes">
          <p>Não utilizamos cookies de rastreamento de terceiros (Meta Pixel, Google Ads, etc.). Os únicos terceiros que podem definir cookies técnicos são:</p>
          <ul className="space-y-1.5">
            {[['Microsoft Azure CDN','servir os ativos do frontend com menor latência.'],['OpenRouter','integrações técnicas para o assistente de IA - sem rastreamento de usuário.']].map(([name, desc]) => (
              <li key={name} className="flex items-start gap-2">
                <i className="fa-solid fa-circle-dot text-stone-600 text-[8px] mt-1.5 flex-shrink-0" />
                <span><strong className="text-stone-300">{name}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard number="04" title="Como gerenciar cookies" icon="fa-sliders">
          <p>Você pode gerenciar suas preferências de cookies a qualquer momento:</p>
          <ul className="space-y-2">
            {[['Via banner de consentimento','Clique em "Política de Cookies" no rodapé da página para reabrir o painel de preferências.'],['Via configurações do navegador','Chrome, Firefox, Safari e Edge permitem bloquear ou excluir cookies específicos nas configurações de privacidade.'],['Via requisição direta','Envie um e-mail para contato@plantelligence.cloud solicitando a exclusão dos seus dados de sessão.']].map(([title, desc]) => (
              <div key={title} className="rounded-xl border border-stone-800/40 bg-stone-800/30 p-3">
                <p className="text-xs font-semibold text-stone-200 mb-0.5">{title}</p>
                <p className="text-[11px] text-stone-500">{desc}</p>
              </div>
            ))}
          </ul>
          <p className="text-stone-500 text-xs">Desativar cookies essenciais impede o login e compromete funcionalidades críticas da plataforma.</p>
        </SectionCard>

        <SectionCard number="05" title="Atualizações desta política" icon="fa-pen-to-square">
          <p>Esta política pode ser atualizada para refletir mudanças técnicas ou legais. A data de vigência será atualizada e os usuários notificados por e-mail quando houver mudanças relevantes.</p>
        </SectionCard>

      </main>

      <footer className="relative text-center pb-16 px-6">
        <Link to="/" className="inline-flex items-center gap-2.5 rounded-xl border border-stone-700 px-6 py-3 text-sm font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white">
          <i className="fa-solid fa-arrow-left text-xs" /> Voltar ao inicio
        </Link>
        <p className="mt-6 text-[11px] text-stone-700">Plantelligence - Política de Cookies - vigente desde 26/11/2025</p>
      </footer>
    </div>
  );
}
