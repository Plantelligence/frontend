import React from 'react';
import { PolicyPageLayout } from '../components/PolicyPageLayout.jsx';

const cardClassName = 'rounded-3xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-[0_24px_48px_-16px_rgba(185,28,28,0.25)]';
const textClassName = 'text-[15px] leading-relaxed text-slate-200/85';

// Renderiza a politica de cookies da plataforma.
export function CookiesPage() {
  return (
    <PolicyPageLayout
      eyebrow="Política de Cookies - Plantelligence"
      title="Saiba como utilizamos cookies para manter a plataforma de monitoramento funcionando com segurança e estabilidade."
    >
      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">1. O que são cookies?</h2>
        <p className={textClassName}>
          Cookies são pequenos arquivos de texto armazenados pelo navegador para manter sessões
          seguras e lembrar preferências.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">2. Tipos de cookies que usamos</h2>
        <ul className={`${textClassName} ml-5 list-disc space-y-2`}>
          <li>
            <strong>Estritamente necessários:</strong> essenciais para autenticação, sessão do usuário
            e operação dos painéis (preferências básicas e segurança).
          </li>
        </ul>
        <p className={`${textClassName} mt-3`}>
          Não utilizamos cookies para armazenar dados pessoais sem consentimento.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">3. Como gerenciar cookies</h2>
        <p className={textClassName}>
          Você pode alterar ou retirar seu consentimento a qualquer momento nas configurações do
          navegador.
        </p>
        <p className={`${textClassName} mt-2`}>
          Desativar cookies estritamente necessários pode comprometer funcionalidades críticas da
          plataforma.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">4. Boas práticas</h2>
        <ul className={`${textClassName} ml-5 list-disc space-y-2`}>
          <li>Mantenha seu navegador atualizado.</li>
          <li>Revise periodicamente suas configurações de privacidade.</li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">5. Contato</h2>
        <p className={textClassName}>
          Dúvidas sobre cookies? Entre em contato:{' '}
          <a className="text-red-400 hover:underline" href="mailto:contato@plantelligence.cloud">
            contato@plantelligence.cloud
          </a>
          .
        </p>
      </section>
    </PolicyPageLayout>
  );
}
