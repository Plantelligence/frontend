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
        <p className={textClassName}>
          Coletamos as seguintes informações fornecidas ativamente para a prestação do serviço:
        </p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Nome completo</li>
          <li>E-mail</li>
          <li>Consentimento LGPD</li>
          <li>Dados de Localização e Propriedade (CEP, Cidade e Estado informados no cadastro de estufas)</li>
          <li>
            Registros de Acesso coletados automaticamente (Endereço IP, credenciais de sessão,
            logs de data e hora)
          </li>
        </ul>
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
          <li>Operar as rotinas de automação com base nos limites definidos pelos sensores.</li>
          <li>
            Consultar informações meteorológicas locais com base no CEP para emitir alertas e
            recomendações preditivas.
          </li>
          <li>Responder dúvidas e solicitações técnicas relacionadas à operação da plataforma.</li>
        </ul>
        <p className={`${textClassName} mt-3`}>
          Não utilizamos os dados para marketing sem consentimento explícito.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">3. Compartilhamento e Transferência Internacional</h2>
        <p className={textClassName}>
          A Plantelligence não comercializa e não compartilha seus dados com terceiros para fins
          publicitários. O tráfego e armazenamento de dados ocorrem de forma integrada com
          provedores de infraestrutura e serviços estritamente necessários para a execução da
          plataforma, compreendendo:
        </p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Serviços de hospedagem em nuvem e centrais de mensageria (Microsoft Azure e Azure IoT Hub)</li>
          <li>Provedores de API para o assistente virtual de Inteligência Artificial (Groq)</li>
          <li>Provedores de API para previsões climáticas locais (OpenWeatherMap)</li>
        </ul>
        <p className={`${textClassName} mt-3`}>
          Considerando a natureza dos serviços globais em nuvem fornecidos por parceiros como a
          Microsoft, os dados operacionais podem ser objeto de transferência internacional de
          dados, mantendo os critérios rigorosos de segurança técnica exigidos pela legislação.
        </p>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">4. Retenção e Legislação Soberana</h2>
        <p className={textClassName}>
          Os dados serão armazenados em ambiente seguro pelo tempo necessário para atender à
          finalidade informada ou conforme exigido por lei. Em caso de pedido de exclusão da conta
          pelo titular, critérios regulatórios específicos se sobrepõem à eliminação imediata:
        </p>
        <ul className={`${textClassName} ml-5 mt-3 list-disc space-y-3`}>
          <li>
            <strong className="text-slate-100">Registros de Acesso e IPs:</strong> Mantidos pelo
            período obrigatório de 6 (seis) meses para o estrito cumprimento de dever legal
            estabelecido pelo Marco Civil da Internet (Lei nº 12.965/2014).
          </li>
          <li>
            <strong className="text-slate-100">Dados Fiscais e Financeiros:</strong> Caso existam
            transações ou assinaturas de planos de contratação, as informações de faturamento e
            dados comerciais correlatos serão guardados pelo prazo mínimo de 5 (cinco) anos, em
            conformidade com as exigências de fiscalização do Código Tributário Nacional.
          </li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">5. Segurança</h2>
        <p className={textClassName}>
          Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
        </p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li>Criptografia em trânsito (HTTPS/TLS) e criptografia de ponta a ponta na comunicação IoT (MQTTS).</li>
          <li>Controle de acesso restrito baseado em regras de perfis (RBAC).</li>
          <li>Monitoramento de segurança e auditoria interna de logs.</li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">6. Cookies</h2>
        <p className={textClassName}>
          Utilizamos apenas cookies estritamente necessários para o funcionamento e estabilidade
          da plataforma, garantindo a manutenção da sessão de login ativa e proteção do tráfego.
          Não armazenamos dados pessoais em cookies.
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
        <h2 className="mb-3 text-lg font-semibold text-red-400">8. Encarregado de Proteção de Dados (DPO)</h2>
        <p className={textClassName}>
          Em conformidade com as diretrizes legais estabelecidas no Artigo 41 da LGPD, o titular
          de dados pode acionar diretamente o Encarregado de Proteção de Dados (DPO) da
          organização Plantelligence para dirimir dúvidas estruturais, realizar requisições de
          direitos ou reportar incidentes:
        </p>
        <ul className={`${textClassName} ml-5 mt-2 list-disc space-y-2`}>
          <li><strong className="text-slate-100">Responsável:</strong> Fillipe Mateus Pereira</li>
          <li>
            <strong className="text-slate-100">E-mail:</strong>{' '}
            <a className="text-red-400 hover:underline" href="mailto:privacidade@plantelligence.cloud">
              privacidade@plantelligence.cloud
            </a>
          </li>
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="mb-3 text-lg font-semibold text-red-400">9. Atualizações</h2>
        <p className={textClassName}>
          Este Aviso poderá ser atualizado a qualquer momento. A versão mais recente estará sempre
          disponível na plataforma.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
