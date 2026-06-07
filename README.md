# Plantelligence — Frontend

Dashboard React para o sistema de monitoramento de estufas.

---

## Setup

```bash
npm install
npm run dev
# http://localhost:5173
```

O proxy de dev redireciona `/api` para `http://localhost:4001`. Configurável via `VITE_DEV_API_PROXY_TARGET` no `.env.local`.

---

## Build

```bash
npm run build
# Arquivos em dist/
```

`staticwebapp.config.json` já configurado para Azure Static Web Apps (SPA fallback).

---

## Estrutura

```
src/
├── api/          # Clientes HTTP (um arquivo por domínio)
├── components/   # Componentes reutilizáveis
├── hooks/        # useIdleTimer, useEmailCooldown
├── pages/        # Páginas da aplicação
├── store/        # authStore, themeStore (Zustand)
└── utils/        # Utilitários
```

---

## Páginas

| Rota | Descrição |
|------|-----------|
| / | Landing page |
| /login | Login (e-mail → senha → MFA) |
| /dashboard | Lista de estufas |
| /dashboard/estufas/:id | Centro de Comando + abas |
| /dashboard/chat | Chat com IA |
| /dashboard/presets | Perfis de cultivo |
| /dashboard/relatorios | Relatórios |
| /help | Documentação |
