/**
 * TermsPage - Termos de Uso do Plantelligence.
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

const InfoBox = ({ icon, color, children }) => {
  const c = { blue: 'border-blue-500/30 bg-blue-500/8 text-blue-300', amber: 'border-amber-500/30 bg-amber-500/8 text-amber-300' };
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${c[color] || c.blue}`}>
      <i className={`fa-solid ${icon} mt-0.5 flex-shrink-0 text-sm`} />
      <div className="text-sm">{children}</div>
    </div>
  );
};

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0c0909] text-stone-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-red-600/6 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'radial-gradient(circle,#ef4444 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <header className="relative mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/8 px-4 py-1.5 mb-6">
          <i className="fa-solid fa-file-contract text-red-400 text-[11px]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">Termos de Uso</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">Termos de Uso</h1>
        <p className="text-stone-400 text-base leading-relaxed max-w-2xl mx-auto">Condições que regem o uso da plataforma Plantelligence e de todos os seus recursos de automação para estufas de cogumelos.</p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-calendar text-stone-600" /> Vigente: 26/11/2025</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-building text-stone-600" /> Plantelligence</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-envelope text-stone-600" /> contato@plantelligence.cloud</span>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pb-20 space-y-4">
        <InfoBox icon="fa-circle-exclamation" color="amber">
          Ao acessar ou utilizar o Plantelligence, você declara que leu, compreendeu e concorda integralmente com estes Termos. Se não concordar, não utilize o serviço.
        </InfoBox>

        <SectionCard number="01" title="Aceitação" icon="fa-handshake">
          <p>O uso do serviço constitui aceitação integral destes Termos e da Política de Privacidade. Versões anteriores ficam arquivadas e podem ser solicitadas por e-mail.</p>
        </SectionCard>

        <SectionCard number="02" title="Elegibilidade e conta" icon="fa-user-check">
          <p>O uso requer capacidade legal para contratar (maior de 18 anos ou representante autorizado).</p>
          <p>Você e responsavel por: manter a confidencialidade das credenciais, todas as atividades realizadas pela sua conta e pela segurança dos dispositivos ESP32 vinculados.</p>
          <InfoBox icon="fa-triangle-exclamation" color="amber">
            Compartilhar credenciais de acesso e uma violacao destes Termos e pode resultar no encerramento imediato da conta.
          </InfoBox>
        </SectionCard>

        <SectionCard number="03" title="Escopo do serviço" icon="fa-server">
          <p>O Plantelligence oferece:</p>
          <ul className="space-y-1.5">
            {['Monitoramento de telemetria em tempo real via ESP32 e Azure IoT Hub.','Automação de atuadores com base em presets de cultivo configuraveis.','Assistente de IA especializado em fungicultura.','Relatorios periodicos e historico de telemetria.','Controles remotos de lampadas e nebulizadores via painel web.','Gestao de equipe com perfis RBAC (Admin, Colaborador, Leitor).'].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <i className="fa-solid fa-check text-emerald-400 text-[10px] mt-1 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard number="04" title="Uso aceitavel" icon="fa-circle-check">
          <p>E permitido usar o serviço para monitoramento e automação de estufas agricolas proprias ou gerenciadas pela sua organizacao.</p>
          <p>E proibido:</p>
          <ul className="space-y-1.5">
            {['Realizar engenharia reversa ou tentar acessar o código-fonte da plataforma.','Usar o serviço para fins ilícitos ou que violem direitos de terceiros.','Sobrecarregar intencionalmente a infraestrutura com requisições automatizadas.','Transmitir dados falsos de sensores para manipular automações.','Compartilhar acesso com usuarios não autorizados pela organizacao.'].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <i className="fa-solid fa-xmark text-red-400 text-[10px] mt-1 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard number="05" title="Propriedade intelectual" icon="fa-copyright">
          <p>Todo o codigo, design, marca e documentacao da plataforma sao de propriedade exclusiva do Plantelligence.</p>
          <p>Os dados de telemetria gerados pelos seus sensores sao de sua propriedade. Você pode exporta-los a qualquer momento.</p>
        </SectionCard>

        <SectionCard number="06" title="Disponibilidade e SLA" icon="fa-server">
          <p>O Plantelligence e oferecido como serviço educacional e de pesquisa (TCC). Não ha garantia formal de SLA nesta fase.</p>
          <p>Interrupções programadas serao comunicadas com pelo menos 24 horas de antecedência via e-mail.</p>
        </SectionCard>

        <SectionCard number="07" title="Limitacao de responsabilidade" icon="fa-scale-balanced">
          <p>O Plantelligence não se responsabiliza por perdas de producao agricola decorrentes de falhas na automação, interrupção do serviço ou leituras incorretas de sensores.</p>
          <InfoBox icon="fa-circle-info" color="blue">
            Recomendamos sempre manter monitoramento fisico como backup, especialmente em fases criticas do cultivo.
          </InfoBox>
        </SectionCard>

        <SectionCard number="08" title="Encerramento" icon="fa-door-open">
          <p>Você pode encerrar sua conta a qualquer momento via configurações da conta ou por e-mail para contato@plantelligence.cloud.</p>
          <p>Reservamos o direito de encerrar contas que violem estes Termos, com ou sem aviso previo dependendo da gravidade.</p>
        </SectionCard>

        <SectionCard number="09" title="Alterações nos termos" icon="fa-pen-to-square">
          <p>Estes Termos podem ser atualizados periodicamente. Alterações relevantes serao comunicadas por e-mail com 15 dias de antecedência. O uso continuado após a data de vigência constitui aceitação das novas condições.</p>
        </SectionCard>

        <SectionCard number="10" title="Lei aplicavel" icon="fa-gavel">
          <p>Estes Termos sao regidos pela legislacao brasileira, especialmente o CDC, o Marco Civil da Internet e a LGPD. O foro competente e o da comarca de domicilio do Controlador.</p>
        </SectionCard>
      </main>

      <footer className="relative text-center pb-16 px-6">
        <Link to="/" className="inline-flex items-center gap-2.5 rounded-xl border border-stone-700 px-6 py-3 text-sm font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white">
          <i className="fa-solid fa-arrow-left text-xs" /> Voltar ao inicio
        </Link>
        <p className="mt-6 text-[11px] text-stone-700">Plantelligence - Termos de Uso - vigente desde 26/11/2025</p>
      </footer>
    </div>
  );
}
