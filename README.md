# frontend

Repositório do Front-End do projeto Plantelligence.

## Deploy no Azure Static Web Apps

Este projeto usa Vite e faz build para a pasta `dist`.

### 1. Pré-requisitos

- Repositório conectado ao recurso Azure Static Web App
- Secret do GitHub criado no repositório:
	- `AZURE_STATIC_WEB_APPS_API_TOKEN`

### 2. Workflow

O deploy automático está configurado em:

- `.github/workflows/azure-static-web-apps.yml`

Fluxo:

- `push` na branch `main`: build + deploy de `dist`
- pull request: cria/atualiza ambiente de preview
- fechamento da pull request: fecha preview

### 3. Variáveis de ambiente (frontend)

No Azure Static Web Apps, configure as variáveis em Environment Variables:

- `VITE_APP_API_URL`

Comportamento:

- vazio: frontend usa `/api`
- URL absoluta (ex.: `https://api.seudominio.com`): frontend usa `https://api.seudominio.com/api`

### 4. Publicar

1. Faça commit e push na `main`.
2. Acompanhe o workflow no GitHub Actions.
3. Ao finalizar, atualize o domínio e faça hard refresh (`Ctrl+F5`).

Se continuar aparecendo a tela padrão da Azure, o deploy não executou com sucesso ou está publicando um diretório incorreto. Neste projeto, o diretório publicado deve ser `dist`.
