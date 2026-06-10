# Plantelligence - Frontend

Interface web do sistema de automação e monitoramento de estufas de cogumelos, desenvolvido como TCC. Construído com React + Vite + Tailwind CSS, consome a API REST do backend e exibe dados em tempo real.

---

## Funcionalidades

- **Autenticação multi-step:** fluxo de login em etapas (e-mail, senha e MFA TOTP), tela de primeiro acesso, recuperação de senha, tela de bloqueio por inatividade
- **Dashboard:** gauges SVG dos 4 sensores (temperatura, umidade, CO₂, luminosidade), indicadores de atuadores, alertas ativos e painel de controles
- **Monitoramento histórico:** gráficos de linha/área/barra com Recharts para séries temporais de telemetria, seleção de intervalo de tempo
- **Centro de Comando:** health score, aderência ao preset, itens críticos, fase biológica atual, ações rápidas e previsão de curto prazo
- **Gestão de estufas:** listagem com filtros, cadastro via wizard de onboarding (estufa e dispositivo ESP32 em etapas), edição e exclusão
- **Dispositivos IoT:** cadastro de ESP32, geração de credenciais e QR code para configuração, download de firmware
- **Presets de cultivo:** visualização e seleção de perfis de parâmetros ideais por espécie, sugestão via IA
- **Chat IA:** assistente especializado com streaming SSE em tempo real, contexto dinâmico da estufa selecionada, suporte a Markdown
- **Alertas e notificações:** central de notificações in-app, configuração de preferências por canal (in-app e e-mail)
- **Relatórios:** listagem, visualização de resumos BI com gráficos de barras, download e geração manual
- **Configurações do usuário:** troca de senha, configuração de MFA, exclusão de conta, gestão de consentimento LGPD
- **Administração:** gestão de usuários (Admin), logs de segurança com trilha de auditoria
- **Páginas institucionais:** Landing, Tecnologia, Sobre, Contato, Política de Privacidade, Termos de Uso, Cookies, EULA, Ajuda

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + Vite |
| Estilização | Tailwind CSS |
| Roteamento | React Router DOM v6 |
| Estado global | Zustand |
| Gráficos | Recharts |
| HTTP | Axios |
| Chat (streaming) | EventSource (SSE nativo) |
| MFA (QR code) | react-qr-code |
| Testes | Vitest + Testing Library + jsdom |

---

## Pré-requisitos

- Node.js 18+
- npm 9+

```bash
npm install
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz de `frontend/` com as variáveis abaixo. **Este arquivo nunca vai para o repositório** - em produção as variáveis são fornecidas pelo Azure Static Web Apps.

```env
# URL da API backend
VITE_API_URL=http://localhost:4001

# Ambiente
VITE_ENV=development
```

Em produção no Azure, `VITE_API_URL` aponta para o App Service do backend. As variáveis são injetadas no build pelo pipeline CI/CD.

---

## Executar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (porta 5173)
npm run dev
```

O frontend ficará disponível em `http://localhost:5173`.

O backend deve estar rodando em `http://localhost:4001` (ou o valor configurado em `VITE_API_URL`).

### Build de produção

```bash
npm run build
# Artefatos gerados em: dist/
```

---

## Testes

### Estrutura

```
src/__testes__/
├── configuracao.js              # setup global do Vitest (jest-dom matchers)
├── api/
│   ├── authService.test.js      # testes do serviço de autenticação
│   └── greenhouseService.test.js
├── components/
│   ├── CardEstufa.test.jsx      # renderização e interação de componentes
│   ├── ConfirmDialog.test.jsx
│   ├── InputField.test.jsx
│   └── ProtectedRoute.test.jsx
└── utils/
    ├── mensagens-de-erro.test.js
    └── politica-de-senhas.test.js
```

### Executar

```bash
# Todos os testes (modo run)
npm run test

# Com cobertura
npm run test -- --coverage
# Relatório HTML gerado em: coverage/index.html

# Modo watch (desenvolvimento)
npx vitest
```

### Resultado atual

```
src/__testes__/api/              2 suites  - 14 passed
src/__testes__/components/       4 suites  - 33 passed
src/__testes__/utils/            2 suites  - 18 passed
----------------------------------------------------
TOTAL                            8 suites  - 65 passed
```

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção (saída em `dist/`) |
| `npm run preview` | Serve o build localmente para validação |
| `npm run test` | Executa todos os testes uma vez |
| `npm run lint` | ESLint em todos os arquivos `.jsx/.js` |
