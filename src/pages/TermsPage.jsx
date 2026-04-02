import React from 'react';
import { PolicyPageLayout } from '../components/PolicyPageLayout.jsx';

const cardClassName = 'rounded-3xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-[0_24px_48px_-16px_rgba(185,28,28,0.25)]';
const textClassName = 'text-[15px] leading-relaxed text-slate-200/85';

export function TermsPage() {
  return (
    <PolicyPageLayout
      eyebrow="Termos de Uso - Plantelligence"
      title="Leia atentamente as condições abaixo, pois elas estabelecem as regras para utilização da plataforma Plantelligence e seus recursos de automação para estufas de cogumelos."
    >
      <section className={cardClassName}>
        <ul className={`${textClassName} ml-5 list-disc space-y-2`}>
          <li><strong>Vigente a partir de:</strong> 26/11/2025</li>
          <li><strong>Controlador / Fornecedor:</strong> Plantelligence</li>
          <li>
            <strong>Contato:</strong>{' '}
            <a className="text-red-400 hover:underline" href="mailto:contato@plantelligence.cloud">
              contato@plantelligence.cloud
            </a>
          </li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">1. Aceitação</h2>
        <p className={textClassName}>
          Ao acessar ou utilizar a plataforma Plantelligence ("Serviço"), você declara que leu,
          compreendeu e concorda integralmente com estes Termos.
        </p>
        <p className={`${textClassName} mt-2`}>Se não concordar com qualquer condição, não utilize o Serviço.</p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">2. Elegibilidade e Conta</h2>
        <p className={textClassName}>O uso do Serviço requer capacidade legal.</p>
        <p className={`${textClassName} mt-2`}>
          O usuário é responsável por manter a confidencialidade de suas credenciais e por todas
          as atividades realizadas por meio de sua conta.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">3. Escopo do Serviço</h2>
        <p className={textClassName}>
          A Plantelligence oferece recursos para monitoramento, automação e análise de estufas de
          cogumelos, com foco em segurança, confiabilidade e conformidade.
        </p>
        <p className={`${textClassName} mt-2`}>
          O Serviço não altera permissões corporativas nem acessos externos, respeitando
          integralmente as políticas definidas pelo usuário.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">4. Licença de Uso</h2>
        <p className={textClassName}>
          A Plantelligence concede ao usuário uma licença limitada, não exclusiva, intransferível e
          revogável para utilização do Serviço, conforme estes Termos.
        </p>
        <p className={`${textClassName} mt-2`}>É expressamente vedado:</p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Realizar engenharia reversa, descompilar ou modificar o Serviço.</li>
          <li>Utilizar o Serviço para fins ilícitos ou contrários à legislação.</li>
          <li>Burlar mecanismos de segurança ou autenticação.</li>
          <li>Sobrecarregar a infraestrutura da aplicação.</li>
          <li>Tentar acessar dados de terceiros sem autorização.</li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">5. Planos e Pagamentos</h2>
        <p className={textClassName}>O Serviço pode ser disponibilizado em:</p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Período de avaliação gratuita (Trial).</li>
          <li>
            Planos pagos, com cobrança mensal ou anual, conforme apresentado na tela de
            contratação.
          </li>
        </ul>
        <p className={`${textClassName} mt-2`}>
          Pagamentos não são reembolsáveis, salvo em casos previstos em lei ou falha comprovadamente
          atribuível ao Serviço.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">6. Privacidade e Dados</h2>
        <p className={textClassName}>
          O tratamento de dados pessoais segue a Política de Privacidade disponível na plataforma.
        </p>
        <p className={`${textClassName} mt-2`}>
          O Serviço poderá processar informações mínimas para autenticação e execução das ações
          solicitadas.
        </p>
        <p className={`${textClassName} mt-2`}>Os conteúdos do usuário permanecem sob sua responsabilidade.</p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">7. Integrações de Terceiros</h2>
        <p className={textClassName}>
          O Serviço pode depender de integrações com provedores de nuvem ou APIs externas.
        </p>
        <p className={`${textClassName} mt-2`}>
          Ao utilizar o Serviço, o usuário também concorda com os termos e políticas desses
          provedores.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">8. Propriedade Intelectual</h2>
        <p className={textClassName}>
          O código, marca, design e materiais associados à Plantelligence são de propriedade
          exclusiva da empresa.
        </p>
        <p className={`${textClassName} mt-2`}>
          Nada nestes Termos confere ao usuário qualquer direito de propriedade intelectual além da
          licença de uso prevista.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">9. Disponibilidade e Suporte</h2>
        <p className={textClassName}>O Serviço é fornecido “no estado em que se encontra” e “conforme disponível”.</p>
        <p className={`${textClassName} mt-2`}>
          A Plantelligence emprega esforços razoáveis para manter o sistema atualizado, seguro e
          funcional.
        </p>
        <p className={`${textClassName} mt-2`}>
          Suporte técnico é prestado via contato oficial:{' '}
          <a className="text-red-400 hover:underline" href="mailto:contato@plantelligence.cloud">
            contato@plantelligence.cloud
          </a>
          .
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">10. Uso Aceitável</h2>
        <p className={textClassName}>É proibido:</p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Armazenar ou compartilhar conteúdo ilícito.</li>
          <li>Violar direitos autorais, de imagem ou privacidade.</li>
          <li>Expor dados confidenciais sem autorização.</li>
          <li>Utilizar o Serviço para atividades que infrinjam normas corporativas ou legais.</li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">11. Rescisão</h2>
        <p className={textClassName}>A Plantelligence poderá suspender ou encerrar o acesso ao Serviço em casos de:</p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Violação destes Termos.</li>
          <li>Risco de segurança ou uso indevido.</li>
          <li>Cumprimento de ordem legal.</li>
        </ul>
        <p className={`${textClassName} mt-2`}>O usuário pode encerrar o uso a qualquer momento.</p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">12. Limitação de Responsabilidade</h2>
        <p className={textClassName}>
          Na máxima extensão permitida por lei, a Plantelligence não se responsabiliza por:
        </p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Lucros cessantes, perda de dados, danos indiretos ou consequenciais.</li>
          <li>Falhas de terceiros (provedores de internet, serviços externos).</li>
          <li>Uso indevido ou não autorizado do Serviço.</li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">13. Alterações</h2>
        <p className={textClassName}>
          Alterações materiais nestes Termos serão comunicadas por meio do portal oficial ou e-mail
          cadastrado.
        </p>
        <p className={`${textClassName} mt-2`}>
          O uso contínuo após a publicação implica aceitação automática da nova versão.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">14. Lei Aplicável</h2>
        <p className={textClassName}>Lei aplicável: Leis da República Federativa do Brasil.</p>
        <p className={`${textClassName} mt-2`}>Foro: Comarca de São Paulo/SP.</p>
      </section>
    </PolicyPageLayout>
  );
}
