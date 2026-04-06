import React from 'react';
import { PolicyPageLayout } from '../components/PolicyPageLayout.jsx';

const cardClassName = 'rounded-3xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-[0_24px_48px_-16px_rgba(185,28,28,0.25)]';
const textClassName = 'text-[15px] leading-relaxed text-slate-200/85';

// Renderiza a politica de privacidade alinhada a LGPD.
export function PrivacyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Política de Privacidade - Plantelligence"
      title="Entenda como a Plantelligence protege os dados pessoais coletados durante o uso da plataforma de monitoramento de estufas de cogumelos."
    >
      <section className={cardClassName}>
        <p className={textClassName}>
          Este Aviso de Privacidade estabelece as regras adotadas pela Plantelligence para
          proteção dos dados pessoais de seus usuários, em conformidade com a Lei Geral de
          Proteção de Dados (LGPD).
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">1. Quais dados coletamos</h2>
        <p className={textClassName}>Coletamos apenas:</p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Nome completo</li>
          <li>E-mail</li>
          <li>Consentimento LGPD</li>
        </ul>
        <p className={`${textClassName} mt-3`}>
          Esses dados são informados durante o cadastro para criação e proteção da conta.
        </p>
        <p className={`${textClassName} mt-3`}>
          O telefone não é coletado no cadastro inicial. Caso exista campo de telefone em
          configurações de conta, o preenchimento é opcional.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">2. Finalidade</h2>
        <p className={textClassName}>Utilizamos os dados coletados exclusivamente para:</p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Gerenciar o acesso seguro ao painel de telemetria das estufas.</li>
          <li>Responder dúvidas e solicitações técnicas relacionadas à operação da plataforma.</li>
        </ul>
        <p className={`${textClassName} mt-3`}>
          Não utilizamos os dados para marketing sem consentimento explícito.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">3. Compartilhamento</h2>
        <p className={textClassName}>
          A Plantelligence não comercializa e não compartilha seus dados com terceiros, salvo
          quando necessário para cumprimento de obrigação legal.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">4. Retenção</h2>
        <p className={textClassName}>
          Os dados serão armazenados em ambiente seguro pelo tempo necessário para atender à
          finalidade informada ou conforme exigido por lei.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">5. Segurança</h2>
        <p className={textClassName}>
          Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
        </p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Criptografia em trânsito.</li>
          <li>Controle de acesso restrito.</li>
          <li>Monitoramento de segurança.</li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">6. Cookies</h2>
        <p className={textClassName}>
          Utilizamos apenas cookies estritamente necessários para funcionamento da plataforma. Não
          armazenamos dados pessoais em cookies.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">7. Direitos do titular</h2>
        <p className={textClassName}>Você pode solicitar:</p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Acesso aos seus dados.</li>
          <li>Correção de dados incorretos.</li>
          <li>Eliminação dos dados.</li>
          <li>Revogação do consentimento.</li>
        </ul>
        <p className={`${textClassName} mt-3`}>
          Para exercer seus direitos, entre em contato:{' '}
          <a className="text-red-400 hover:underline" href="mailto:privacidade@plantelligence.cloud">
            privacidade@plantelligence.cloud
          </a>
          .
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">8. Atualizações</h2>
        <p className={textClassName}>
          Este Aviso poderá ser atualizado a qualquer momento. A versão mais recente estará sempre
          disponível na plataforma.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
