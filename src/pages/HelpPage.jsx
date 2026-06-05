/**
 * HelpPage — Documentação completa do Plantelligence em linguagem acessível.
 * Cobre todas as funcionalidades implementadas, melhorias recentes e roadmap futuro.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Seções da documentação
const SECTIONS = [
  { id: 'inicio',        icon: 'fa-house',           label: 'Primeiros passos' },
  { id: 'login',         icon: 'fa-lock',            label: 'Login e segurança' },
  { id: 'estufas',       icon: 'fa-seedling',        label: 'Estufas e dispositivos' },
  { id: 'telemetria',    icon: 'fa-chart-line',      label: 'Telemetria e alertas' },
  { id: 'controles',     icon: 'fa-sliders',         label: 'Controles remotos' },
  { id: 'perfis',        icon: 'fa-leaf',            label: 'Perfis de cultivo' },
  { id: 'relatorios',    icon: 'fa-chart-bar',       label: 'Relatórios' },
  { id: 'chat',          icon: 'fa-robot',           label: 'Chat com IA' },
  { id: 'notificacoes',  icon: 'fa-bell',            label: 'Notificações' },
  { id: 'equipe',        icon: 'fa-users',           label: 'Equipe e permissões' },
  { id: 'configuracoes', icon: 'fa-gear',            label: 'Configurações da conta' },
  { id: 'roadmap',       icon: 'fa-rocket',          label: 'Próximas melhorias' },
];

const Badge = ({ color, children }) => {
  const colors = {
    green:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    blue:   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
    amber:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    red:    'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

const Section = ({ id, icon, title, children }) => (
  <section id={id} className="scroll-mt-20">
    <div className="mb-6 flex items-center gap-3 border-b border-stone-200 pb-4 dark:border-stone-700">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10">
        <i className={`fa-solid ${icon} text-red-500 text-base`} />
      </div>
      <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">{title}</h2>
    </div>
    <div className="space-y-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
      {children}
    </div>
  </section>
);

const InfoBox = ({ icon = 'fa-circle-info', color = 'blue', children }) => {
  const colors = {
    blue:  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  };
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${colors[color]}`}>
      <i className={`fa-solid ${icon} mt-0.5 flex-shrink-0`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

const Step = ({ num, title, children }) => (
  <div className="flex gap-4">
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white mt-0.5">
      {num}
    </div>
    <div className="min-w-0 pb-4 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <p className="font-semibold text-stone-800 dark:text-stone-100 mb-1">{title}</p>
      <div className="text-stone-600 dark:text-stone-400">{children}</div>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, description, badge, badgeColor = 'green' }) => (
  <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-800/40">
    <div className="mb-2 flex items-center gap-2.5">
      <i className={`fa-solid ${icon} text-red-500`} />
      <p className="font-semibold text-stone-800 dark:text-stone-100">{title}</p>
      {badge && <Badge color={badgeColor}>{badge}</Badge>}
    </div>
    <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
  </div>
);

export const HelpPage = () => {
  const [activeSection, setActiveSection] = useState('inicio');

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex gap-8">
      {/* Índice lateral fixo */}
      <aside className="hidden xl:flex w-56 flex-shrink-0 flex-col gap-1 sticky top-6 self-start">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Documentação</p>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
              activeSection === s.id
                ? 'bg-red-50 font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <i className={`fa-solid ${s.icon} w-4 text-center text-xs`} />
            {s.label}
          </button>
        ))}

        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800/40">
          <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">Precisa de ajuda?</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-500 mb-2">Nossa equipe responde em até 24h.</p>
          <a href="mailto:contato@plantelligence.cloud"
            className="block text-center rounded-lg bg-red-600 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700 transition">
            Falar com suporte
          </a>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="min-w-0 flex-1 space-y-12">

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-8 text-white">
          <Badge color="red">Versão 2.1.0</Badge>
          <h1 className="mt-3 text-3xl font-bold">Central de Ajuda</h1>
          <p className="mt-2 text-red-100 text-base">
            Tudo o que você precisa saber para usar o Plantelligence, explicado de forma simples e direta.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {SECTIONS.slice(0, 6).map((s) => (
              <button key={s.id} type="button" onClick={() => scrollTo(s.id)}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25 transition">
                <i className={`fa-solid ${s.icon} text-[10px]`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECAO 1: Primeiros passos */}
        <Section id="inicio" icon="fa-house" title="Primeiros passos">
          <p>
            O <strong className="text-stone-800 dark:text-stone-200">Plantelligence</strong> é uma plataforma web para monitoramento e automação de estufas de cogumelos.
            Ela conecta sensores físicos (ESP32) à nuvem, exibe dados em tempo real e envia alertas automáticos
            quando as condições da estufa saem da faixa ideal.
          </p>

          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <FeatureCard icon="fa-wifi" title="Telemetria IoT" description="Temperatura, umidade e luminosidade da estufa em tempo real via ESP32." badge="Ativo" />
            <FeatureCard icon="fa-shield-halved" title="Segurança MFA" description="Autenticação em dois fatores obrigatória para proteção da conta." badge="Ativo" />
            <FeatureCard icon="fa-scale-balanced" title="LGPD" description="Conformidade com a Lei Geral de Proteção de Dados brasileira." badge="Ativo" />
          </div>

          <InfoBox color="green" icon="fa-circle-check">
            <strong>Requisito mínimo:</strong> Navegador moderno (Chrome, Edge, Firefox, Safari) com conexão à internet.
            O sistema funciona em celular, tablet e computador.
          </InfoBox>
        </Section>

        {/* SECAO 2: Login */}
        <Section id="login" icon="fa-lock" title="Login e segurança">
          <p>O acesso ao sistema usa um fluxo em etapas, similar ao Gmail ou Microsoft — mais seguro e organizado.</p>

          <div className="space-y-3 mt-2">
            <Step num={1} title="Digite seu e-mail">
              O sistema verifica se o e-mail está cadastrado antes de prosseguir. Se não existir, aparece um aviso claro.
            </Step>
            <Step num={2} title="Digite sua senha">
              Com o e-mail confirmado, você digita a senha. Aqui aparece o link "Esqueceu a senha?" caso precise.
            </Step>
            <Step num={3} title="Verificação MFA (dois fatores)">
              Por segurança, todo acesso exige um segundo fator. O método principal é o <strong className="text-stone-800 dark:text-stone-200">aplicativo autenticador</strong> (Google Authenticator, Microsoft Authenticator ou similar).
              Se precisar, clique em "Entrar de outra maneira" para receber um código por e-mail.
            </Step>
          </div>

          <InfoBox color="amber" icon="fa-triangle-exclamation">
            <strong>Esqueceu a senha?</strong> Clique em "Esqueceu a senha?" na tela de senha. Você pode verificar sua identidade pelo
            código do autenticador (sem precisar de acesso ao e-mail) ou receber um código por e-mail para criar uma nova senha.
            A nova senha deve ter mínimo 8 caracteres, incluindo maiúscula, número e caractere especial.
          </InfoBox>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <FeatureCard icon="fa-mobile-screen-button" title="Autenticador TOTP" description="Configure o app autenticador nas configurações da conta para ter acesso rápido sem depender do e-mail." badge="Recomendado" badgeColor="green" />
            <FeatureCard icon="fa-envelope" title="Código por e-mail" description="Alternativa ao autenticador. Receba o código de 6 dígitos no e-mail cadastrado." badge="Alternativo" badgeColor="blue" />
          </div>
        </Section>

        {/* SECAO 3: Estufas */}
        <Section id="estufas" icon="fa-seedling" title="Estufas e dispositivos IoT">
          <p>
            Cada estufa é um espaço de monitoramento independente. Você pode ter várias estufas na mesma organização,
            cada uma com seus próprios sensores e perfil de cultivo.
          </p>

          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mt-4 mb-2">Criando uma estufa</h3>
          <div className="space-y-3">
            <Step num={1} title='Clique em "Criar nova estufa" no menu lateral'>
              Preencha o nome da estufa e as informações básicas. Você pode criar quantas estufas precisar.
            </Step>
            <Step num={2} title="Adicione um dispositivo ESP32">
              Cada estufa pode ter sensores físicos conectados. No painel da estufa, vá em "Dispositivos" e clique em "Adicionar dispositivo".
              O sistema gera um firmware personalizado para configurar o ESP32.
            </Step>
            <Step num={3} title="Instale o firmware no ESP32">
              Copie os arquivos gerados (boot.py e main.py) para o ESP32 usando a ferramenta de sua preferência (Thonny, etc.).
              Configure o Wi-Fi e o dispositivo se conectará automaticamente à nuvem.
            </Step>
            <Step num={4} title="Aguarde a confirmação de conexão">
              Após ligar, o ESP32 envia uma mensagem de "handshake". O sistema confirma a conexão e o dispositivo aparece como "Conectado".
            </Step>
          </div>

          <InfoBox color="blue" icon="fa-circle-info">
            O firmware usa o protocolo <strong>MQTT sobre TLS</strong> para se comunicar com a nuvem Azure IoT Hub de forma segura e eficiente.
            Cada dispositivo tem credenciais únicas geradas automaticamente pelo sistema.
          </InfoBox>

          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-2">Gerenciando estufas</h3>
          <p>
            Na tela principal do painel, todas as suas estufas aparecem em cards. Clique em uma estufa para ver
            os dados em tempo real, controles e configurações. Você pode editar o nome, excluir a estufa ou
            gerenciar a equipe que tem acesso a ela.
          </p>
        </Section>

        {/* SECAO 4: Telemetria */}
        <Section id="telemetria" icon="fa-chart-line" title="Telemetria e alertas automáticos">
          <p>
            O sistema recebe dados dos sensores a cada poucos segundos e os exibe no painel em tempo real.
            Quando algum valor sai da faixa ideal definida no perfil de cultivo, um <strong className="text-stone-800 dark:text-stone-200">alerta é disparado automaticamente</strong>.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <FeatureCard icon="fa-thermometer-half" title="Temperatura" description="Monitoramento contínuo em °C. Faixas: crítico baixo, alerta baixo, ideal, alerta alto, crítico alto." badge="Sensor IoT" />
            <FeatureCard icon="fa-droplet" title="Umidade do ar" description="Percentual de umidade relativa. Fundamental para o desenvolvimento dos cogumelos." badge="Sensor IoT" />
            <FeatureCard icon="fa-sun" title="Luminosidade" description="Intensidade de luz em lux. Controla o ciclo de frutificação dos cogumelos." badge="Sensor IoT" />
            <FeatureCard icon="fa-cloud" title="Clima externo" description="Dados meteorológicos da cidade da estufa usados como referência comparativa." badge="Automatico" badgeColor="blue" />
          </div>

          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-2">Como funcionam os alertas</h3>
          <p>
            Cada estufa tem um <strong className="text-stone-800 dark:text-stone-200">perfil de cultivo</strong> ativo que define as faixas ideais.
            O sistema avalia os dados a cada ciclo e, quando detecta desvio, realiza duas ações simultaneamente:
          </p>
          <ul className="mt-2 space-y-1.5 list-disc list-inside text-stone-600 dark:text-stone-400">
            <li><strong className="text-stone-700 dark:text-stone-300">Notificação in-app:</strong> aparece no sino de notificações no canto superior direito</li>
            <li><strong className="text-stone-700 dark:text-stone-300">E-mail automático:</strong> enviado para os responsáveis cadastrados na estufa, com assunto como "[ATENÇÃO] Condição climática severa da estufa Nome da Estufa"</li>
          </ul>

          <InfoBox color="amber" icon="fa-bell">
            Os e-mails de alerta incluem uma tabela comparando os valores atuais com os ideais, a fonte dos dados
            (sensor interno ou clima da cidade) e sugestões de ação.
          </InfoBox>
        </Section>

        {/* SECAO 5: Controles */}
        <Section id="controles" icon="fa-sliders" title="Controles remotos (IoT)">
          <p>
            Na aba <strong className="text-stone-800 dark:text-stone-200">Controles</strong> de cada estufa, você pode acionar os dispositivos físicos
            diretamente pelo sistema, sem precisar estar presente fisicamente.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <FeatureCard
              icon="fa-lightbulb"
              title="Lampada"
              description="Controla a iluminação da estufa. Ligar aumenta temperatura e luminosidade, auxiliando na frutificação."
              badge="C2D IoT"
              badgeColor="amber"
            />
            <FeatureCard
              icon="fa-droplet"
              title="Nebulizador"
              description="Controla o nebulizador de umidade. Ligar aumenta a umidade do ar e reduz a temperatura da estufa."
              badge="C2D IoT"
              badgeColor="blue"
            />
          </div>

          <InfoBox color="blue" icon="fa-satellite-dish">
            Os comandos são enviados via <strong>Cloud-to-Device (C2D)</strong> pelo Azure IoT Hub.
            O ESP32 recebe a instrução via MQTT, aciona o relé correspondente e confirma a execução
            enviando telemetria de estado atualizado em segundos.
          </InfoBox>

          <p className="mt-4">
            O estado atual de cada atuador (ligado/desligado) é lido diretamente da última telemetria recebida do ESP32,
            garantindo que o que você vê na tela reflete a situação real do equipamento.
          </p>
        </Section>

        {/* SECAO 6: Perfis */}
        <Section id="perfis" icon="fa-leaf" title="Perfis de cultivo">
          <p>
            Os perfis de cultivo definem as <strong className="text-stone-800 dark:text-stone-200">condições ideais</strong> para cada tipo de cogumelo.
            São eles que determinam quando o sistema deve disparar alertas.
          </p>

          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <FeatureCard icon="fa-book" title="Perfis padrão" description="O sistema vem com perfis pré-configurados para as espécies mais comuns (Shiitake, Oyster, etc.). Não podem ser editados." badge="Sistema" badgeColor="blue" />
            <FeatureCard icon="fa-pencil" title="Perfis personalizados" description="Crie seus próprios perfis ajustando as faixas de temperatura, umidade, luminosidade e umidade do solo." badge="Seu perfil" badgeColor="green" />
            <FeatureCard icon="fa-robot" title="Criar com IA" description="Descreva a cultura em linguagem natural (ex: 'Shiitake em clima quente e úmido') e a IA sugere os parâmetros ideais." badge="IA" badgeColor="purple" />
          </div>

          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-2">Faixas de monitoramento</h3>
          <p>Cada parâmetro tem 5 faixas configuráveis:</p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/60">
                  <th className="px-4 py-2 font-semibold text-stone-700 dark:text-stone-300">Faixa</th>
                  <th className="px-4 py-2 font-semibold text-stone-700 dark:text-stone-300">Significado</th>
                  <th className="px-4 py-2 font-semibold text-stone-700 dark:text-stone-300">Ação do sistema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {[
                  ['Crítico baixo', 'Valor muito abaixo do ideal', 'Alerta crítico + e-mail'],
                  ['Alerta baixo',  'Valor levemente abaixo',     'Alerta de aviso'],
                  ['Ideal',         'Condição perfeita para cultivo', 'Sem alerta'],
                  ['Alerta alto',   'Valor levemente acima',      'Alerta de aviso'],
                  ['Crítico alto',  'Valor muito acima do ideal', 'Alerta crítico + e-mail'],
                ].map(([faixa, sig, acao]) => (
                  <tr key={faixa} className="text-stone-600 dark:text-stone-400">
                    <td className="px-4 py-2 font-medium text-stone-800 dark:text-stone-200">{faixa}</td>
                    <td className="px-4 py-2">{sig}</td>
                    <td className="px-4 py-2">{acao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* SECAO 7: Relatorios */}
        <Section id="relatorios" icon="fa-chart-bar" title="Relatórios">
          <p>
            A seção de Relatórios permite registrar e consultar o histórico de cada estufa por períodos específicos.
            Útil para acompanhar a evolução do cultivo ao longo do tempo e identificar padrões.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <FeatureCard icon="fa-calendar-plus" title="Novo relatório" description="Registre um período de cultivo com data de início e fim, associado a um perfil de cultivo." />
            <FeatureCard icon="fa-magnifying-glass-chart" title="Histórico" description="Consulte todos os relatórios anteriores, filtrando por estufa e período." />
          </div>

          <InfoBox color="blue" icon="fa-circle-info">
            <strong>Melhoria planejada:</strong> Em breve, os relatórios incluirão gráficos automáticos com a média de temperatura, umidade e luminosidade
            do período, gerados a partir dos dados de telemetria armazenados.
          </InfoBox>
        </Section>

        {/* SECAO 8: Chat IA */}
        <Section id="chat" icon="fa-robot" title="Chat com IA">
          <p>
            O assistente de IA do Plantelligence é especializado em cultivo de cogumelos e automação de estufas.
            Ele pode responder dúvidas, interpretar alertas e sugerir ajustes nos parâmetros de cultivo.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <FeatureCard icon="fa-comment-dots" title="Respostas em tempo real" description="As respostas são geradas com streaming — você vê o texto sendo construído palavra por palavra, sem esperar." badge="Streaming" badgeColor="green" />
            <FeatureCard icon="fa-shield-halved" title="Privacidade" description="O chat é restrito a temas de cultivo. Não envie dados pessoais sensíveis nas mensagens." badge="LGPD" badgeColor="blue" />
          </div>

          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-2">O que você pode perguntar</h3>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>"Qual a temperatura ideal para cultivar Shiitake?"</li>
            <li>"Estou recebendo alertas de umidade alta, o que fazer?"</li>
            <li>"Quanto tempo leva a frutificação do Oyster mushroom?"</li>
            <li>"Me explique o que é o ciclo de pinning dos cogumelos"</li>
            <li>"A temperatura da minha estufa está em 28°C, isso é crítico para Shimeji?"</li>
          </ul>
        </Section>

        {/* SECAO 9: Notificacoes */}
        <Section id="notificacoes" icon="fa-bell" title="Notificações">
          <p>
            O sistema de notificações mantém você informado sobre tudo que acontece nas estufas, sem precisar
            ficar atualizando a página.
          </p>

          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <FeatureCard icon="fa-bell" title="In-app" description="Aparecem no sino no canto superior direito. Badge vermelho mostra quantas não foram lidas." badge="Sempre ativo" />
            <FeatureCard icon="fa-envelope" title="Por e-mail" description="Alertas críticos chegam no seu e-mail automaticamente, mesmo quando você não está no sistema." badge="Configurável" badgeColor="blue" />
            <FeatureCard icon="fa-clock" title="Retenção de 30 dias" description="Notificações ficam armazenadas por 30 dias. Após esse período são removidas automaticamente." badge="Automático" badgeColor="amber" />
          </div>

          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-2">Gerenciando notificações</h3>
          <p>Clique no sino no canto superior direito para ver todas as notificações. Você pode:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Marcar uma notificação como lida clicando nela</li>
            <li>Marcar todas como lidas de uma vez</li>
            <li>Limpar todas as notificações com o botão "Limpar"</li>
          </ul>
        </Section>

        {/* SECAO 10: Equipe */}
        <Section id="equipe" icon="fa-users" title="Equipe e permissões">
          <p>
            O Plantelligence usa um sistema de papéis (roles) para controlar o que cada membro da equipe
            pode fazer dentro da organização.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/60">
                  <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Papel</th>
                  <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">O que pode fazer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3"><Badge color="red">Administrador</Badge></td>
                  <td className="px-4 py-3">Acesso total: gerencia estufas, equipe, permissões e logs de segurança.</td>
                </tr>
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3"><Badge color="blue">Colaborador</Badge></td>
                  <td className="px-4 py-3">Visualiza e opera estufas delegadas. Pode acionar controles IoT.</td>
                </tr>
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3"><Badge color="amber">Leitor</Badge></td>
                  <td className="px-4 py-3">Apenas visualização. Não pode criar estufas nem acionar controles.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mt-6 mb-2">Convidando membros</h3>
          <div className="space-y-3">
            <Step num={1} title="Acesse Usuários e permissões">
              Disponível no menu do avatar no canto superior direito (apenas Administradores).
            </Step>
            <Step num={2} title="Preencha o e-mail e selecione o papel">
              O novo membro receberá um e-mail com um link para definir sua senha e ativar o acesso.
            </Step>
            <Step num={3} title="Delegue acesso às estufas">
              Colaboradores e Leitores só veem as estufas que o Administrador delegar para eles.
            </Step>
          </div>
        </Section>

        {/* SECAO 11: Configuracoes */}
        <Section id="configuracoes" icon="fa-gear" title="Configurações da conta">
          <p>Acesse as configurações pelo menu do avatar no canto superior direito.</p>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <FeatureCard icon="fa-key" title="Trocar senha" description="Para trocar a senha, você precisa confirmar com o segundo fator (autenticador ou e-mail). Isso evita que alguém com acesso momentâneo ao computador troque a senha." />
            <FeatureCard icon="fa-mobile-screen-button" title="Configurar autenticador" description="Configure ou reconfigure o app autenticador TOTP. O QR Code é exibido para escanear com qualquer app compatível." />
            <FeatureCard icon="fa-bell-slash" title="Preferências de notificação" description="Escolha quais tipos de notificação receber por e-mail e quais apenas no sistema." />
            <FeatureCard icon="fa-moon" title="Tema claro / escuro" description="Troque o tema pelo botão no rodapé do menu lateral. A preferência é salva automaticamente no navegador." badge="Novo" badgeColor="green" />
          </div>
        </Section>

        {/* SECAO 12: Roadmap */}
        <Section id="roadmap" icon="fa-rocket" title="Próximas melhorias">
          <p>
            O Plantelligence está em desenvolvimento ativo. Aqui estão as funcionalidades planejadas para as próximas versões:
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <FeatureCard icon="fa-chart-area" title="Gráficos históricos" description="Visualização de temperatura, umidade e luminosidade ao longo do tempo com filtros por período." badge="Breve" badgeColor="purple" />
            <FeatureCard icon="fa-file-pdf" title="Relatórios em PDF" description="Exportação de relatórios de cultivo em PDF, incluindo gráficos e resumo do período." badge="Planejado" badgeColor="purple" />
            <FeatureCard icon="fa-mobile" title="App mobile nativo" description="Aplicativo para iOS e Android com notificações push em tempo real." badge="Futuro" badgeColor="amber" />
            <FeatureCard icon="fa-envelope-open-text" title="Relatórios por e-mail" description="Receba um resumo semanal ou mensal das suas estufas diretamente no e-mail." badge="Planejado" badgeColor="purple" />
            <FeatureCard icon="fa-plug" title="Integrações externas" description="Conexão com sistemas de automação industrial e ERPs agrícolas." badge="Futuro" badgeColor="amber" />
            <FeatureCard icon="fa-brain" title="IA preditiva" description="Análise preditiva que antecipa problemas antes que ocorram, baseada no histórico da estufa." badge="Futuro" badgeColor="amber" />
          </div>

          <InfoBox color="green" icon="fa-lightbulb">
            <strong>Tem uma sugestão?</strong> Use o botão <strong>"Enviar feedback"</strong> no rodapé do menu lateral para nos enviar sua ideia.
            Todas as sugestões são analisadas pela equipe de desenvolvimento.
          </InfoBox>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-700 dark:bg-stone-800/40 text-center">
            <i className="fa-solid fa-envelope text-2xl text-red-500 mb-3 block" />
            <p className="font-semibold text-stone-800 dark:text-stone-100">Precisa de suporte ou tem dúvidas?</p>
            <p className="mt-1 text-stone-500 dark:text-stone-400 text-sm">Nossa equipe responde em até 24 horas úteis.</p>
            <a href="mailto:contato@plantelligence.cloud"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition">
              <i className="fa-solid fa-envelope" />
              contato@plantelligence.cloud
            </a>
          </div>
        </Section>

      </div>
    </div>
  );
};
