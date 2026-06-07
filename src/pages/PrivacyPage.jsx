/**
 * PrivacyPage - Política de Privacidade do Plantelligence.
 * Design premium SaaS, conformidade LGPD.
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

const DataItem = ({ label, desc }) => (
  <div className="flex items-start gap-2">
    <i className="fa-solid fa-circle-dot text-red-500/60 text-[8px] mt-1.5 flex-shrink-0" />
    <span><strong className="text-stone-300">{label}:</strong> {desc}</span>
  </div>
);

const InfoBox = ({ icon, color, children }) => {
  const c = { blue: 'border-blue-500/30 bg-blue-500/8 text-blue-300', amber: 'border-amber-500/30 bg-amber-500/8 text-amber-300', green: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300' };
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${c[color] || c.blue}`}>
      <i className={`fa-solid ${icon} mt-0.5 flex-shrink-0 text-sm`} />
      <div className="text-sm">{children}</div>
    </div>
  );
};

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0c0909] text-stone-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-red-600/6 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'radial-gradient(circle,#ef4444 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <header className="relative mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/8 px-4 py-1.5 mb-6">
          <i className="fa-solid fa-user-shield text-red-400 text-[11px]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">Privacidade e LGPD</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">Política de Privacidade</h1>
        <p className="text-stone-400 text-base leading-relaxed max-w-2xl mx-auto">Como o Plantelligence coleta, usa e protege seus dados pessoais, em conformidade com a LGPD (Lei n. 13.709/2018).</p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-calendar text-stone-600" /> Vigente: 26/11/2025</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-building text-stone-600" /> Controlador: Plantelligence</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-envelope text-stone-600" /> contato@plantelligence.cloud</span>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pb-20 space-y-4">
        <InfoBox icon="fa-circle-info" color="blue">
          Este Aviso estabelece as regras adotadas pelo Plantelligence para proteção dos dados pessoais, em conformidade com a LGPD.
        </InfoBox>

        <SectionCard number="01" title="Dados coletados" icon="fa-database">
          <DataItem label="Nome completo" desc="fornecido no cadastro para identificação." />
          <DataItem label="E-mail" desc="usado para autenticação, notificações e comunicacao." />
          <DataItem label="Consentimento LGPD" desc="registro do aceite dos termos e políticas." />
          <DataItem label="Localização da estufa" desc="CEP, cidade e estado para consulta de clima externo." />
          <DataItem label="Registros de acesso" desc="IP, data/hora de login e logs de sessão para segurança." />
          <p className="text-stone-500 text-xs">Não coletamos telefone, documentos de identidade nem dados bancários.</p>
        </SectionCard>

        <SectionCard number="02" title="Finalidade do tratamento" icon="fa-bullseye">
          <DataItem label="Acesso seguro" desc="gerenciar autenticação, MFA e sessões." />
          <DataItem label="Automação" desc="operar rotinas de controle de sensores e atuadores." />
          <DataItem label="Alertas" desc="notificar desvios de temperatura, umidade ou falhas de dispositivo." />
          <DataItem label="Segurança" desc="detectar acessos suspeitos e manter trilha de auditoria." />
          <InfoBox icon="fa-ban" color="amber">Seus dados não são vendidos nem usados para publicidade.</InfoBox>
        </SectionCard>

        <SectionCard number="03" title="Base legal (LGPD)" icon="fa-scale-balanced">
          <DataItem label="Execução de contrato" desc="necessário para fornecer os serviços (Art. 7, V)." />
          <DataItem label="Cumprimento legal" desc="obrigações de registro e auditoria (Art. 7, II)." />
          <DataItem label="Interesse legítimo" desc="segurança e prevenção de fraudes (Art. 7, IX)." />
          <DataItem label="Consentimento" desc="para funcionalidades opcionais como cookies analíticos (Art. 7, I)." />
        </SectionCard>

        <SectionCard number="04" title="Compartilhamento" icon="fa-share-nodes">
          <DataItem label="Microsoft Azure" desc="infraestrutura IoT Hub e armazenamento. Tratados conforme DPA da Microsoft." />
          <DataItem label="Provedores SMTP" desc="envio de e-mails transacionais. Nenhum dado de telemetria é transmitido." />
          <p>Todos os fornecedores adotam medidas de segurança equivalentes.</p>
        </SectionCard>

        <SectionCard number="05" title="Retenção" icon="fa-clock-rotate-left">
          <DataItem label="Conta ativa" desc="dados mantidos enquanto a conta estiver ativa." />
          <DataItem label="Encerramento" desc="dados excluídos em até 30 dias após o encerramento." />
          <DataItem label="Logs de segurança" desc="retidos por até 12 meses para conformidade legal." />
          <DataItem label="Telemetria" desc="retida conforme política do InfluxDB (padrão: 90 dias)." />
        </SectionCard>

        <SectionCard number="06" title="Seus direitos" icon="fa-hand-holding-heart">
          <p>Conforme a LGPD, você pode a qualquer momento:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[['fa-eye','Acesso','Ver os dados que temos sobre você.'],['fa-pen','Correção','Corrigir dados imprecisos.'],['fa-trash','Exclusão','Solicitar remoção dos seus dados.'],['fa-file-export','Portabilidade','Receber seus dados em formato estruturado.'],['fa-ban','Oposição','Opor-se ao tratamento em determinadas situações.'],['fa-circle-info','Informação','Saber com quem compartilhamos seus dados.']].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-2 rounded-xl border border-stone-800/40 bg-stone-800/30 p-3">
                <i className={`fa-solid ${icon} text-red-400 text-xs mt-0.5 flex-shrink-0`} />
                <div><p className="text-xs font-semibold text-stone-200">{title}</p><p className="text-[10px] text-stone-500 mt-0.5">{desc}</p></div>
              </div>
            ))}
          </div>
          <p>Contato: <a href="mailto:contato@plantelligence.cloud" className="text-red-400 hover:underline">contato@plantelligence.cloud</a> - prazo de resposta: 15 dias úteis.</p>
        </SectionCard>

        <SectionCard number="07" title="Segurança" icon="fa-shield-halved">
          <DataItem label="Criptografia em trânsito" desc="HTTPS/TLS em todas as comunicações." />
          <DataItem label="MFA obrigatório" desc="autenticação multifator via TOTP ou e-mail." />
          <DataItem label="Trilha de auditoria" desc="log imutável de ações criticas com encadeamento hash." />
          <DataItem label="RBAC" desc="controle de acesso por perfil: Admin, Colaborador e Leitor." />
          <DataItem label="Zero Data Retention" desc="conversas com a IA não são armazenadas pelo provedor." />
        </SectionCard>
      </main>

      <footer className="relative text-center pb-16 px-6">
        <Link to="/" className="inline-flex items-center gap-2.5 rounded-xl border border-stone-700 px-6 py-3 text-sm font-semibold text-stone-300 transition hover:border-stone-500 hover:text-white">
          <i className="fa-solid fa-arrow-left text-xs" /> Voltar ao inicio
        </Link>
        <p className="mt-6 text-[11px] text-stone-700">Plantelligence - Política de Privacidade - vigente desde 26/11/2025</p>
      </footer>
    </div>
  );
}
