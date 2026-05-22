# Plataforma de Disparos WhatsApp (disparoswpp)

## TL;DR

> **Quick Summary**: Construir do zero uma plataforma SaaS multi-tenant de disparos em massa via WhatsApp usando Evolution API como backend de mensageria, Next.js 16 para o painel web, BullMQ para filas de agendamento e PostgreSQL para persistência — hospedada em Docker no VPS Windows Server (Quantum Key).
>
> **Deliverables**:
> - Aplicação Next.js completa com auth, dashboard, gestão de campanhas e inbox
> - Workers BullMQ para disparo, agendamento e throttling
> - Docker Compose pronto para VPS com 5 serviços (app, postgres, redis, worker, evolution-api)
> - Setup da VPS (pasta, clone repo, variáveis de ambiente, containers up)
> - Repositório https://github.com/peubraw/disparoswpp com CI básico
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 7 waves
> **Critical Path**: T1 → T2+T3 (schema+types) → T6+T7+T9+T10 (features core) → T11 (worker disparo) → T12+T13 (scheduling+reports) → T15 (deploy VPS) → T16 (smoke) → F1-F4

---

## Context

### Original Request
"Vamos começar um novo projeto usando OpenWA. A pessoa vai conectar o número do WhatsApp dela e ter acesso a uma plataforma de disparos de mensagens. Usar Docker, hospedar na VPS da Quantum Key (Windows Server C:\quantumkey). Novo repositório: https://github.com/peubraw/disparoswpp"

### Interview Summary
**Key Discussions**:
- **OpenWA → Evolution API**: VPS já usa `atendai/evolution-api:v2.2.3` no QuantumKey. Evolution API é REST API moderna baseada em Baileys, multi-sessão nativo, sem Puppeteer direto. Usuário optou pela melhor solução técnica.
- **Modelo**: SaaS multi-tenant (cada usuário com seus próprios números e campanhas)
- **Escala MVP**: 1-5 números WhatsApp por usuário
- **Features**: Completo — texto, mídia, CSV (10k limit), variáveis, agendamento, throttling, relatórios, inbox somente leitura
- **Stack**: Alinhada com QuantumKey (Next.js 16.2.2 + Prisma + PostgreSQL + shadcn/ui + NextAuth v5)
- **MVP sem domínio**: Acesso por IP:3001, sem HTTPS no MVP

**Research Findings**:
- VPS mapeada via SSH: Windows Server, Docker 29.1.3, Nginx com SSL em painel.quantumkey.com.br
- QuantumKey usa multi-stage Dockerfile (node:22), Next.js standalone, Evolution API no compose
- Portas livres confirmadas: 3001 (app), 8081 (Evolution), 5433 (postgres), 6380 (redis)
- BullMQ + Redis validado para filas de disparo em produção (noeviction policy obrigatória)

### Metis Review
**Decisões incorporadas**:
- CSV: limite 10.000 contatos por import
- Agendamento no passado: disparar imediatamente com aviso na UI
- Inbox: somente leitura (sem responder pela plataforma no MVP)
- Sessões WA: persistência obrigatória via Docker volumes (sobreviver restarts)
- Evolution API: versão mais recente estável no momento do build

---

## Work Objectives

### Core Objective
Plataforma SaaS multi-tenant onde cada usuário conecta 1-5 números WhatsApp via QR code e cria campanhas de mensagens em massa com agendamento, throttling anti-ban, relatórios de entrega e inbox de respostas.

### Concrete Deliverables
- `src/` — aplicação Next.js 16 completa (App Router, TypeScript)
- `prisma/schema.prisma` — schema completo (users, wa_instances, campaigns, contacts, messages, inbox)
- `workers/` — BullMQ workers para disparo, agendamento e processamento de webhooks
- `docker-compose.yml` — orquestração dos 5 serviços
- `Dockerfile` — multi-stage build (node:22), idêntico ao padrão QuantumKey
- `.env.example` — todas as variáveis documentadas
- VPS configurada com containers rodando acessíveis em http://IP:3001

### Definition of Done
- [ ] `docker compose up -d` na VPS sobe todos os 5 serviços sem erro
- [ ] Acessar http://IP_VPS:3001 → página de login carrega
- [ ] Criar conta → conectar número WA via QR → criar campanha CSV → disparar → ver relatório
- [ ] Webhook de status Evolution API atualiza mensagens no banco em tempo real
- [ ] Reiniciar containers → instâncias WA reconectam automaticamente (sessão persistida)

### Must Have
- Multi-tenancy: dados de cada usuário isolados (userId em todas as queries)
- Persistência de sessão WA obrigatória (Docker volume para `/evolution/instances`)
- Throttling: delay configurável entre mensagens (mínimo 1s, máximo 60s)
- Limite CSV: 10.000 contatos por importação
- Variáveis personalizadas: `{nome}`, `{empresa}` e campos customizados do CSV
- Status de mensagem em tempo real via webhooks Evolution API
- BullMQ `maxRetriesPerRequest: null` (obrigatório para workers)
- Docker `shm_size: 1g` no container Evolution API

### Must NOT Have (Guardrails)
- HTTPS/SSL no MVP (sem Nginx/Traefik/Caddy no docker-compose)
- Responder mensagens pelo inbox (somente leitura no MVP)
- Billing/pagamento integrado
- Chatbot ou respostas automáticas
- Meta WhatsApp Business API (apenas Evolution API / Baileys)
- Import de mais de 10.000 contatos por arquivo
- Múltiplos workspaces por conta
- `as any` / `@ts-ignore` sem justificativa
- Console.log em código de produção
- Lógica de negócio em Server Components (apenas em Server Actions ou API Routes)
- Portas conflitando com QuantumKey (evitar 3000, 8080, 5432, 6379)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NÃO
- **Automated tests**: NENHUM (unit tests)
- **Framework**: N/A
- **Agent-Executed QA**: SEMPRE (obrigatório em toda task)

### QA Policy
- **Frontend/UI**: Playwright — navegar, interagir, screenshots
- **API/Backend**: Bash (curl) — requisições HTTP, validar status + campos JSON
- **Evolution API**: Bash (curl) — endpoints /instance, /message
- **Filas BullMQ**: Bash — verificar jobs no Redis via redis-cli
- Evidence salva em `.omo/evidence/task-{N}-{slug}.{ext}`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Fundação — T1 SOZINHO, bloqueia tudo):
└── T1: Scaffolding do projeto + Docker Compose + CI básico [quick]

Wave 2 (Após T1 — 3 tasks em paralelo):
├── T2: Schema Prisma completo + migrations [quick]
├── T3: Tipos TypeScript globais + contratos da Evolution API [quick]
└── T4: Configuração shadcn/ui + tema + layout shell [visual-engineering]

Wave 3 (Após Wave 2 — 5 tasks em paralelo):
├── T5: Sistema de autenticação (NextAuth v5 email+senha) [unspecified-high]  ← depende T2
├── T6: Gestão de instâncias WA — conectar, QR code, status [unspecified-high]  ← depende T2,T3
├── T7: Import de contatos CSV + listas de contatos [unspecified-high]  ← depende T2,T3
├── T9: Criação/edição de campanhas + editor de templates [visual-engineering]  ← depende T2,T3,T4
└── T10: Sistema de webhooks Evolution API → atualização de status [unspecified-high]  ← depende T2,T3

Wave 4 (Após Wave 3 — 3 tasks em paralelo):
├── T8: Dashboard home com métricas [visual-engineering]  ← depende T2,T4,T5
├── T11: Worker BullMQ — disparo com throttling + variáveis [unspecified-high]  ← depende T6,T7,T9,T10
└── T14: Inbox de respostas somente leitura [visual-engineering]  ← depende T10

Wave 5 (Após T11 — 2 tasks; forçado por dependência, não por under-splitting):
├── T12: Agendamento de campanhas — UI + BullMQ delayed jobs [unspecified-high]  ← depende T9,T11
└── T13: Relatórios de entrega em tempo real [visual-engineering]  ← depende T8,T10,T11

Wave 6 (Após Wave 5 — T15 SOZINHO):
└── T15: Deploy na VPS Quantum Key (pasta, clone, .env, docker up) [unspecified-high]

Wave 7 (Após T15 — T16 SOZINHO):
└── T16: Smoke tests end-to-end na VPS (fluxo completo de campanha) [unspecified-high]

Wave FINAL (após TODAS as tasks — 4 revisores em paralelo):
├── F1: Auditoria de conformidade do plano (oracle)
├── F2: Revisão de qualidade de código (unspecified-high)
├── F3: QA manual real end-to-end (unspecified-high + playwright)
└── F4: Verificação de fidelidade de escopo (deep)
→ Apresentar resultados → Aguardar "okay" explícito do usuário
```

### Dependency Matrix

| Task | Depende de | Bloqueia |
|------|-----------|----------|
| T1 | — | T2-T5 (todos) |
| T2 | T1 | T6,T7,T8,T9,T10 |
| T3 | T1 | T6,T7,T9,T10,T11 |
| T4 | T1 | T8,T9,T14 |
| T5 | T1,T2 | T8 |
| T6 | T2,T3 | T11 |
| T7 | T2,T3 | T11 |
| T8 | T2,T4,T5 | T13 |
| T9 | T2,T3,T4 | T11,T12 |
| T10 | T2,T3 | T11,T13 |
| T11 | T6,T7,T9,T10 | T12,T13,T15 |
| T12 | T9,T11 | T15 |
| T13 | T10,T11 | T15 |
| T14 | T10 | T15 |
| T15 | T11,T12,T13,T14 | T16,F1-F4 |
| T16 | T15 | F1-F4 |

### Agent Dispatch Summary
- **Wave 1** (1 task): T1→`quick`
- **Wave 2** (3 tasks): T2→`quick`, T3→`quick`, T4→`visual-engineering`
- **Wave 3** (5 tasks): T5→`unspecified-high`, T6→`unspecified-high`, T7→`unspecified-high`, T9→`visual-engineering`, T10→`unspecified-high`
- **Wave 4** (3 tasks): T8→`visual-engineering`, T11→`unspecified-high`, T14→`visual-engineering`
- **Wave 5** (2 tasks, forçado por deps): T12→`unspecified-high`, T13→`visual-engineering`
- **Wave 6** (1 task): T15→`unspecified-high`
- **Wave 7** (1 task): T16→`unspecified-high`
- **Final** (4 tasks): F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`+`playwright`, F4→`deep`

---

## TODOs

- [x] T1. Scaffolding do projeto + Docker Compose + CI básico

  **What to do**:
  - Criar estrutura de diretórios: `src/app/`, `src/components/`, `src/lib/`, `src/types/`, `workers/`, `prisma/`
  - Inicializar Next.js 16.2.2 com App Router + TypeScript strict (igual QuantumKey: `"next": "16.2.2"`)
  - Instalar dependências: `next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`, `tailwindcss`, `prisma`, `@prisma/client`, `next-auth@5.0.0-beta`, `bullmq`, `ioredis`, `axios`, `zod`, `shadcn` (shadcn/ui), `lucide-react`, `bcryptjs`, `@types/bcryptjs`, `date-fns`, `recharts`, `sonner`
  - Criar `docker-compose.yml` com 5 serviços: `app` (0.0.0.0:3001), `postgres` (127.0.0.1:5433), `redis` (127.0.0.1:6380), `worker`, `evolution-api` (127.0.0.1:8081) — postgres e redis apenas localhost, app exposto publicamente
  - Evolution API: `image: atendai/evolution-api:latest`, `shm_size: "1g"`, volume `evolution_instances:/evolution/instances`
  - Redis: `image: redis:7-alpine`, `command: redis-server --appendonly yes --maxmemory-policy noeviction`
  - PostgreSQL: `image: postgres:16-alpine`, env `POSTGRES_USER=disparos POSTGRES_PASSWORD POSTGRES_DB=disparoswpp`
  - Worker service: `build: ./workers`, depende de postgres + redis
  - App service: multi-stage build, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `EVOLUTION_API_URL=http://evolution-api:8081`, `EVOLUTION_API_KEY`, `REDIS_URL=redis://redis:6379`
  - `Dockerfile` multi-stage (node:22): stage `deps` (npm ci + prisma generate), stage `builder` (next build standalone), stage `runner` (node:22, adicionar libs Chromium como no QuantumKey)
  - `workers/Dockerfile`: node:22-alpine, `CMD ["node", "index.js"]`
  - `.env.example` com todas as variáveis documentadas
  - `.github/workflows/ci.yml`: rodar `tsc --noEmit` + `npm run lint` no push
  - `next.config.ts`: `output: "standalone"`, `images.domains: ["localhost"]`
  - `.gitignore` adequado (node_modules, .next, .env, volumes/)
  - Verificar que `docker compose build` completa sem erro (dry-run local)

  **Must NOT do**:
  - NÃO usar portas 3000, 8080, 5432, 6379 (conflito com QuantumKey)
  - NÃO adicionar Nginx/Traefik/Caddy (sem SSL no MVP)
  - NÃO criar arquivo `.env` com segredos reais no repositório

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Scaffolding é mecânico, estrutura bem definida, sem decisões criativas
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (sozinho — fundação; bloqueia T2-T16)
  - **Blocks**: TODAS as tasks (T2-T16 dependem desta)
  - **Blocked By**: None (iniciar imediatamente)

  **References**:
  - `C:\QuantumKey\docker-compose.vps.yml` — pattern de docker-compose com evolution-api e postgres (via SSH: `ssh server "cat /c/QuantumKey/docker-compose.vps.yml"`)
  - `C:\QuantumKey\Dockerfile` — multi-stage build node:22 com libs Chromium (via SSH: `ssh server "cat /c/QuantumKey/Dockerfile"`)
  - `C:\QuantumKey\package.json` — versões exatas de dependências (Next.js 16.2.2, etc.)
  - Evolution API docs: `https://doc.evolution-api.com/v2/pt/get-started/introduction`

  **Acceptance Criteria**:
  - [ ] `ls src/app/ workers/ prisma/` → estrutura presente
  - [ ] `docker compose config` → valida sem erro
  - [ ] `docker compose build` → build completa (pode levar >5min, aguardar)
  - [ ] `npx tsc --noEmit` → 0 erros

  **QA Scenarios**:
  ```
  Scenario: Docker Compose válido e buildável
    Tool: Bash
    Steps:
      1. docker compose config 2>&1
      2. docker compose build 2>&1 | tail -20
    Expected Result: "build" finaliza sem "ERROR", "config" retorna YAML válido
    Evidence: .omo/evidence/task-1-docker-build.txt

  Scenario: TypeScript projeto válido
    Tool: Bash
    Steps:
      1. npx tsc --noEmit 2>&1
    Expected Result: sem output (0 erros TypeScript)
    Evidence: .omo/evidence/task-1-tsc.txt

  Scenario: .env.example completo
    Tool: Bash
    Steps:
      1. cat .env.example | grep -c "=" 
    Expected Result: número >= 10 (pelo menos 10 variáveis documentadas)
    Evidence: .omo/evidence/task-1-env.txt
  ```

  **Commit**: YES
  - Message: `chore(init): project scaffolding, docker-compose 5 services, dockerfile multi-stage`
  - Files: `*`
  - Pre-commit: `npx tsc --noEmit`

- [x] T2. Schema Prisma completo + migrations

  **What to do**:
  - Criar `prisma/schema.prisma` com datasource postgresql e generator client
  - Modelos:
    - `User`: id (uuid), email (unique), passwordHash, name, createdAt, updatedAt
    - `WaInstance`: id, userId (FK), instanceName (unique), phoneNumber?, status (enum: DISCONNECTED/CONNECTING/CONNECTED), evolutionInstanceId, createdAt, updatedAt
    - `ContactList`: id, userId (FK), name, createdAt
    - `Contact`: id, contactListId (FK), phoneNumber, name?, customFields (Json), createdAt
    - `Campaign`: id, userId (FK), waInstanceId (FK), name, status (enum: DRAFT/SCHEDULED/RUNNING/PAUSED/COMPLETED/FAILED), messageTemplate, mediaUrl?, mediaType (enum: NONE/IMAGE/VIDEO/AUDIO/DOCUMENT)?, scheduledFor?, throttleDelay (Int, ms, default 3000), createdAt, updatedAt
    - `CampaignContactList`: id, campaignId (FK), contactListId (FK) — tabela de junção
    - `Message`: id, campaignId (FK), contactPhone, status (enum: PENDING/SENT/DELIVERED/READ/FAILED), errorMessage?, sentAt?, evolutionMessageId?, createdAt
    - `InboxMessage`: id, userId (FK), waInstanceId (FK), fromPhone, body, mediaUrl?, isRead (Boolean, default false), receivedAt
  - Adicionar índices: `@@index([userId])` em Campaign, `@@index([campaignId])` em Message, `@@index([contactListId])` em Contact
  - Criar migration inicial: `npx prisma migrate dev --name init`
  - Criar `prisma/seed.ts`: usuário admin de teste (`admin@test.com` / `admin123`)
  - Adicionar script `"db:seed": "tsx prisma/seed.ts"` no package.json

  **Must NOT do**:
  - NÃO usar `@db.Text` para campos curtos
  - NÃO omitir `userId` como filtro em relações (multi-tenancy obrigatório)
  - NÃO criar relações polimórficas desnecessárias

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema bem especificado, trabalho mecânico de transcrição
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (com T3, T4)
  - **Blocks**: T6, T7, T8, T9, T10
  - **Blocked By**: T1 (precisa do projeto inicializado)

  **References**:
  - `C:\QuantumKey\prisma\schema.prisma` — padrão de schema Prisma com NextAuth v5 (via SSH)
  - Prisma docs: `https://www.prisma.io/docs/orm/prisma-schema/overview`

  **Acceptance Criteria**:
  - [ ] `npx prisma validate` → "Prisma schema validated successfully"
  - [ ] `npx prisma migrate dev` → migration aplicada sem erro
  - [ ] `npx prisma studio` lista todas as tabelas criadas

  **QA Scenarios**:
  ```
  Scenario: Schema válido e migration aplicada
    Tool: Bash
    Steps:
      1. npx prisma validate 2>&1
      2. npx prisma migrate dev --name init 2>&1 | tail -10
    Expected Result: "Prisma schema validated successfully" e "Migration applied"
    Evidence: .omo/evidence/task-2-migrate.txt

  Scenario: Seed cria usuário de teste
    Tool: Bash
    Steps:
      1. npx tsx prisma/seed.ts 2>&1
      2. npx prisma db execute --stdin <<< "SELECT email FROM \"User\";"
    Expected Result: "admin@test.com" presente nos resultados
    Evidence: .omo/evidence/task-2-seed.txt
  ```

  **Commit**: YES (agrupado com T1)
  - Message: `chore(init): project scaffolding, docker-compose 5 services, dockerfile multi-stage`

- [x] T3. Tipos TypeScript globais + contratos da Evolution API

  **What to do**:
  - Criar `src/types/index.ts` com re-exports de todos os tipos globais
  - Criar `src/types/evolution.ts` com interfaces para Evolution API:
    - `EvolutionInstance`: instanceName, status, owner?
    - `EvolutionQRCode`: code, base64, count
    - `EvolutionSendTextPayload`: number, text, delay?
    - `EvolutionSendMediaPayload`: number, mediatype (image|video|audio|document), mimetype, caption?, media (url ou base64), fileName?
    - `EvolutionWebhookMessage`: event (MESSAGES_UPSERT|MESSAGES_UPDATE|CONNECTION_UPDATE), instance, data
    - `EvolutionMessageStatus`: id, status (PENDING|SENT|DELIVERED|READ|FAILED)
  - Criar `src/types/campaign.ts`:
    - `CampaignStatus`, `MediaType`, `WaInstanceStatus` (enums alinhados com Prisma)
    - `CampaignWithStats`: Campaign + `{ sent: number; delivered: number; read: number; failed: number; total: number }`
    - `ContactRow`: phoneNumber + customFields dinâmicos do CSV
  - Criar `src/lib/evolution-client.ts`: wrapper axios para Evolution API
    - `createInstance(name)`, `getInstanceStatus(name)`, `getQRCode(name)`, `deleteInstance(name)`
    - `sendText(instance, number, text, delay?)`, `sendMedia(instance, payload)`
    - Usar `EVOLUTION_API_URL` + `EVOLUTION_API_KEY` do env
    - Retry automático com backoff em 429/5xx
  - Criar `src/lib/redis.ts`: singleton ioredis com `maxRetriesPerRequest: null`
  - Criar `src/lib/prisma.ts`: singleton PrismaClient (padrão Next.js)
  - Criar `src/lib/utils.ts`: `cn()` (shadcn), `formatPhone()` (garante +55DDnúmero), `interpolateTemplate(template, vars)` (substituir {nome}, {empresa} etc.)

  **Must NOT do**:
  - NÃO usar `any` nos tipos da Evolution API
  - NÃO criar tipos duplicados que já existem no schema Prisma

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Tipos são definidos a partir de documentação conhecida, trabalho mecânico
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (com T2, T4)
  - **Blocks**: T6, T7, T9, T10, T11
  - **Blocked By**: T1

  **References**:
  - Evolution API v2 docs: `https://doc.evolution-api.com/v2/pt/integrations/official/instances`
  - Evolution API send message: `https://doc.evolution-api.com/v2/pt/integrations/official/send-messages`
  - Evolution API webhooks: `https://doc.evolution-api.com/v2/pt/integrations/official/webhooks`

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` → 0 erros
  - [ ] `src/lib/evolution-client.ts` exporta todas as funções listadas
  - [ ] `src/lib/utils.ts` exporta `interpolateTemplate` — testar: `interpolateTemplate("Olá {nome}", {nome: "Pedro"})` → `"Olá Pedro"`

  **QA Scenarios**:
  ```
  Scenario: interpolateTemplate funciona corretamente
    Tool: Bash
    Steps:
      1. node -e "const {interpolateTemplate} = require('./src/lib/utils'); console.log(interpolateTemplate('Olá {nome}, empresa {empresa}', {nome:'Pedro', empresa:'Acme'}))"
    Expected Result: "Olá Pedro, empresa Acme"
    Evidence: .omo/evidence/task-3-interpolate.txt

  Scenario: formatPhone normaliza números
    Tool: Bash
    Steps:
      1. node -e "const {formatPhone} = require('./src/lib/utils'); console.log(formatPhone('11999999999'))"
    Expected Result: "+5511999999999" ou "5511999999999" (formato esperado pela Evolution API)
    Evidence: .omo/evidence/task-3-formatphone.txt
  ```

  **Commit**: YES (agrupado com T1)

- [x] T4. Configuração shadcn/ui + tema + layout shell

  **What to do**:
  - Inicializar shadcn/ui: `npx shadcn init` (New York style, slate color, CSS variables)
  - Instalar componentes necessários: `button`, `input`, `label`, `card`, `badge`, `table`, `dialog`, `dropdown-menu`, `sidebar`, `form`, `toast`, `tabs`, `progress`, `skeleton`, `separator`, `avatar`, `alert`, `tooltip`
  - Criar `src/app/layout.tsx`: root layout com Providers (SessionProvider, Toaster/Sonner)
  - Criar `src/app/(auth)/layout.tsx`: layout para páginas de login/registro (centrado, sem sidebar)
  - Criar `src/app/(dashboard)/layout.tsx`: layout com sidebar + header
  - Criar `src/components/layout/sidebar.tsx`: sidebar com navegação principal
    - Links: Dashboard, Instâncias WA, Campanhas, Contatos, Inbox, Relatórios
    - Mostrar avatar do usuário logado + logout
  - Criar `src/components/layout/header.tsx`: header com breadcrumb + notificações
  - Criar `src/components/ui/status-badge.tsx`: badge colorido para status (CONNECTED=verde, DISCONNECTED=vermelho, etc.)
  - Criar `src/components/ui/loading-spinner.tsx`: spinner reutilizável
  - Paleta de cores: verde para WhatsApp (#25D366), neutros para o resto
  - Responsivo: sidebar recolhível em mobile

  **Must NOT do**:
  - NÃO usar cores hardcoded (sempre CSS variables)
  - NÃO criar layout sem considerar mobile (breakpoints Tailwind obrigatórios)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI shell, layout, componentes visuais
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: design de UI/UX, shadcn patterns, Tailwind

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (com T2, T3)
  - **Blocks**: T8, T9, T14
  - **Blocked By**: T1

  **References**:
  - `C:\QuantumKey\src\` — padrão de layout App Router (via SSH, ver estrutura de pastas)
  - `C:\QuantumKey\components.json` — configuração shadcn/ui do QuantumKey
  - shadcn/ui docs: `https://ui.shadcn.com/docs`

  **Acceptance Criteria**:
  - [ ] Acessar `http://localhost:3001` → sidebar e header visíveis
  - [ ] Sidebar colapsa em viewport <768px
  - [ ] Todos os componentes instalados aparecem em `src/components/ui/`

  **QA Scenarios**:
  ```
  Scenario: Layout dashboard renderiza sem erro
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3001/dashboard
      2. Wait for selector "[data-testid='sidebar']" ou "nav" visível
      3. Screenshot
    Expected Result: Layout com sidebar visível, sem console errors
    Evidence: .omo/evidence/task-4-layout.png

  Scenario: Mobile responsivo
    Tool: Playwright
    Steps:
      1. page.setViewportSize({width: 375, height: 812})
      2. Navigate to http://localhost:3001/dashboard
      3. Screenshot
    Expected Result: Sidebar recolhida ou hamburger menu visível
    Evidence: .omo/evidence/task-4-mobile.png
  ```

  **Commit**: YES (agrupado com T1)

- [x] T5. Sistema de autenticação (NextAuth v5 email+senha)

  **What to do**:
  - Instalar e configurar NextAuth v5 beta (já nos deps de T1)
  - Criar `src/auth.ts`: config NextAuth com Prisma adapter + CredentialsProvider
  - CredentialsProvider: validar email+senha com bcryptjs, retornar user object
  - Criar `src/app/api/auth/[...nextauth]/route.ts`
  - Criar `src/app/(auth)/login/page.tsx`: formulário login (email + senha + botão)
  - Criar `src/app/(auth)/register/page.tsx`: formulário registro (nome + email + senha + confirmação)
  - Criar Server Actions: `src/actions/auth.ts`
    - `registerUser(formData)`: validar com Zod, hash senha com bcryptjs, criar User no Prisma
    - `loginUser(formData)`: chamar signIn do NextAuth
  - Criar middleware `src/middleware.ts`: proteger rotas `/dashboard/*` e `/api/protected/*`
  - Criar `src/lib/auth-utils.ts`: `getCurrentUser()` — helper para Server Components
  - Tratamento de erros: mensagem genérica "Email ou senha inválidos" (não revelar qual)
  - Redirect após login: `/dashboard`
  - Redirect após logout: `/login`
  - Sessão: JWT strategy (sem database sessions para simplificar MVP)

  **Must NOT do**:
  - NÃO expor passwordHash em qualquer resposta ou log
  - NÃO usar database sessions (JWT é suficiente para MVP)
  - NÃO criar rotas de admin no MVP

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Auth envolve segurança, múltiplos arquivos, integração NextAuth v5 + Prisma
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (com T6, T7, T9, T10)
  - **Blocks**: T8 (dashboard precisa de auth)
  - **Blocked By**: T1, T2

  **References**:
  - `C:\QuantumKey\src\` — ver padrão de auth NextAuth v5 existente (via SSH)
  - `C:\QuantumKey\package.json` — versão exata next-auth@5.0.0-beta.30
  - NextAuth v5 credentials: `https://authjs.dev/getting-started/authentication/credentials`
  - NextAuth v5 Prisma adapter: `https://authjs.dev/getting-started/adapters/prisma`

  **Acceptance Criteria**:
  - [ ] POST `/api/auth/callback/credentials` com credenciais válidas → 200 + cookie de sessão
  - [ ] Acessar `/dashboard` sem login → redirect para `/login`
  - [ ] Registrar + logar + acessar `/dashboard` → 200

  **QA Scenarios**:
  ```
  Scenario: Registro e login bem-sucedido
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3001/register
      2. Fill form: name="Teste", email="teste@teste.com", password="Teste123!"
      3. Click button[type="submit"]
      4. Wait for navigation to /dashboard (ou /login)
      5. If redirected to /login: fill email+password and submit
      6. Wait for URL to contain "/dashboard"
      7. Screenshot
    Expected Result: URL contém "/dashboard", usuário logado visível no header/sidebar
    Evidence: .omo/evidence/task-5-login-success.png

  Scenario: Credenciais inválidas mostram erro
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3001/login
      2. Fill email="errado@teste.com", password="senhaerrada"
      3. Click submit
      4. Wait for error message visível
    Expected Result: Mensagem de erro genérica visível (NÃO "usuário não encontrado", SIM "credenciais inválidas")
    Evidence: .omo/evidence/task-5-login-error.png

  Scenario: Rota protegida redireciona sem sessão
    Tool: Bash
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/dashboard
    Expected Result: 307 (redirect para /login)
    Evidence: .omo/evidence/task-5-protected.txt
  ```

  **Commit**: YES (agrupado com T1)

- [x] T6. Gestão de instâncias WA — conectar, QR code, status

  **What to do**:
  - Criar `src/app/(dashboard)/instancias/page.tsx`: lista de instâncias do usuário logado
  - Criar `src/app/(dashboard)/instancias/nova/page.tsx`: form para criar nova instância
  - Criar Server Actions `src/actions/instances.ts`:
    - `createInstance(name)`: validar userId, chamar Evolution API `POST /instance/create` com `{instanceName, integration: "WHATSAPP-BAILEYS"}`, salvar no banco com status CONNECTING
    - `getInstanceStatus(instanceId)`: consultar Evolution API `GET /instance/connectionState/{name}`
    - `deleteInstance(instanceId)`: Evolution API `DELETE /instance/delete/{name}`, remover do banco
  - Criar `src/app/api/instances/route.ts` (POST): endpoint REST para criar instância — necessário para QA com curl; chama `createInstance` Server Action internamente
  - Criar `src/app/api/instances/[instanceId]/qr/route.ts` (GET): retornar QR code base64 da Evolution API (`GET /instance/connect/{name}`)
  - Criar `src/components/instances/qr-code-dialog.tsx`: modal com QR code + polling de status (a cada 3s via SWR/fetch)
    - Exibir QR code como imagem (base64)
    - Quando status muda para CONNECTED: fechar modal + toast "Conectado com sucesso!"
    - Timeout após 2min: "QR code expirado, tente novamente"
  - Criar `src/components/instances/instance-card.tsx`: card com nome, número, status badge, ações
  - Variáveis de ambiente obrigatórias: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
  - Máximo 5 instâncias por usuário (validar no Server Action)

  **Must NOT do**:
  - NÃO expor EVOLUTION_API_KEY para o cliente (apenas Server Actions/API Routes)
  - NÃO criar mais de 5 instâncias por usuário (validar antes de chamar Evolution API)
  - NÃO fazer polling de QR code sem cleanup (memory leak)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integração Evolution API, polling de status, UX de QR code
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (com T5, T7, T9, T10)
  - **Blocks**: T11 (workers precisam de instâncias)
  - **Blocked By**: T2, T3

  **References**:
  - Evolution API create instance: `POST /instance/create` — `https://doc.evolution-api.com/v2/pt/integrations/official/instances#create-instance`
  - Evolution API connect/QR: `GET /instance/connect/{instanceName}` retorna `{base64, code, count}`
  - Evolution API connection state: `GET /instance/connectionState/{instanceName}`
  - Evolution API delete: `DELETE /instance/delete/{instanceName}`
  - `src/lib/evolution-client.ts` (criado em T3) — usar as funções já definidas

  **Acceptance Criteria**:
  - [ ] Criar instância → Evolution API cria + salva no banco com status CONNECTING
  - [ ] Acessar QR code → retorna imagem base64 válida
  - [ ] Após scan do QR → status atualiza para CONNECTED no banco
  - [ ] Tentar criar 6ª instância → erro "Limite de 5 instâncias atingido"

  **QA Scenarios**:
  ```
  Scenario: Criar instância e obter QR code
    Tool: Bash + Playwright
    Steps:
      1. curl -s -X POST http://localhost:3001/api/instances \
           -H "Content-Type: application/json" \
           -b "session=COOKIE_VALIDA" \
           -d '{"name":"test-instance"}' | jq .
      2. curl -s http://localhost:3001/api/instances/ID_CRIADO/qr \
           -b "session=COOKIE_VALIDA" | jq '.base64 | length'
    Expected Result: instância criada com status CONNECTING, base64 com comprimento > 100
    Evidence: .omo/evidence/task-6-create-instance.txt

  Scenario: Limite de 5 instâncias
    Tool: Bash
    Steps:
      1. Criar 5 instâncias via API
      2. Tentar criar 6ª: curl -X POST ... -d '{"name":"sexta"}'
      3. Verificar status HTTP
    Expected Result: HTTP 400 ou 422 com mensagem de erro sobre limite
    Evidence: .omo/evidence/task-6-limit.txt
  ```

  **Commit**: YES
  - Message: `feat(wa): whatsapp instance management with QR code via Evolution API`

- [x] T7. Import de contatos CSV + listas de contatos

  **What to do**:
  - Criar `src/app/(dashboard)/contatos/page.tsx`: lista de ContactLists com count de contatos
  - Criar `src/app/(dashboard)/contatos/nova/page.tsx`: form criar lista + upload CSV
  - Criar `src/app/(dashboard)/contatos/[listId]/page.tsx`: visualizar contatos da lista (tabela paginada, 50/página)
  - Criar `src/app/api/contacts/import/route.ts` (POST multipart/form-data):
    - Aceitar arquivo CSV (max 10MB)
    - Parsear CSV com `papaparse` ou `csv-parse` (instalar)
    - Validar: mínimo coluna `phoneNumber` ou `telefone` (case-insensitive)
    - Mapear colunas: detectar automaticamente `nome`/`name`, `empresa`/`company`, demais → `customFields` (JSON)
    - Normalizar telefones: remover não-numéricos, adicionar DDI se ausente
    - Limite: máximo 10.000 linhas (retornar erro 422 se exceder)
    - Inserção em batch via `prisma.contact.createMany` (chunks de 500)
    - Retornar: `{imported: N, duplicates: N, errors: N}`
  - Criar `src/components/contacts/csv-upload.tsx`: dropzone + preview de colunas detectadas + mapeamento manual
  - Criar `src/components/contacts/column-mapper.tsx`: UI para mapear colunas do CSV para campos do sistema
  - Criar Server Actions `src/actions/contacts.ts`:
    - `createContactList(name)`: criar ContactList no banco
    - `deleteContactList(listId)`: verificar que não está em campanha ativa antes de deletar _(Constraint técnico: CampaignContactList é modelo de junção com FK contactListId; Prisma onDelete: Restrict impede deleção se existirem CampaignContactList records apontando para a lista — evita orfanar MessageSend jobs em voo)_
    - `getContactLists()`: retornar listas do usuário logado

  **Must NOT do**:
  - NÃO processar CSV no cliente (apenas no servidor/API route)
  - NÃO permitir import de mais de 10.000 contatos (retornar erro claro)
  - NÃO salvar arquivos CSV no disco do servidor (processar em memória)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Parser CSV, validação, batch insert, UX de upload com mapeamento
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (com T5, T6, T9, T10)
  - **Blocks**: T11
  - **Blocked By**: T2, T3

  **References**:
  - papaparse docs: `https://www.papaparse.com/docs`
  - Prisma createMany: `https://www.prisma.io/docs/orm/reference/prisma-client-reference#createmany`

  **Acceptance Criteria**:
  - [ ] Upload CSV com 100 contatos → todos importados, `{imported: 100, duplicates: 0, errors: 0}`
  - [ ] Upload CSV com 10.001 linhas → HTTP 422 "Limite de 10.000 contatos excedido"
  - [ ] Colunas detectadas automaticamente (phoneNumber, nome/name, empresa/company)
  - [ ] Deletar lista em campanha ativa → erro "Lista em uso por campanha ativa"

  **QA Scenarios**:
  ```
  Scenario: Import CSV bem-sucedido
    Tool: Bash
    Steps:
      1. Criar arquivo /tmp/contatos.csv com 10 linhas: "telefone,nome,empresa\n5511999999999,Pedro,Acme\n..."
      2. curl -X POST http://localhost:3001/api/contacts/import \
           -F "file=@/tmp/contatos.csv" \
           -F "listId=LISTA_ID" \
           -b "session=COOKIE" | jq .
    Expected Result: {"imported":10,"duplicates":0,"errors":0}
    Evidence: .omo/evidence/task-7-csv-import.txt

  Scenario: CSV acima do limite retorna erro
    Tool: Bash
    Steps:
      1. python3 -c "print('telefone,nome'); [print(f'551199{i:07d},User{i}') for i in range(10001)]" > /tmp/big.csv
      2. curl -X POST http://localhost:3001/api/contacts/import -F "file=@/tmp/big.csv" -b "session=COOKIE"
    Expected Result: HTTP 422 com mensagem de erro sobre limite de 10.000
    Evidence: .omo/evidence/task-7-limit.txt
  ```

  **Commit**: YES
  - Message: `feat(contacts): CSV import with column mapping and contact lists`

- [x] T8. Dashboard home com métricas

  **What to do**:
  - Criar `src/app/(dashboard)/dashboard/page.tsx`: página principal com cards de métricas
  - Métricas a exibir:
    - Cards: "Instâncias Conectadas" (N/total), "Campanhas Hoje" (N rodando), "Mensagens Enviadas Hoje" (N), "Taxa de Entrega" (%)
    - Gráfico de linha (recharts): mensagens enviadas vs entregues nos últimos 7 dias
    - Tabela "Campanhas Recentes": últimas 5 campanhas com status badge + progresso (X/total msgs)
    - Lista "Instâncias": status de cada instância WA conectada
  - Criar Server Components para buscar dados (sem useEffect, sem client-side fetching para dados iniciais)
  - Criar `src/actions/dashboard.ts`:
    - `getDashboardStats()`: query agregada no Prisma (count campaigns/messages por status e data)
  - Skeleton loading: usar `<Suspense>` com fallback de skeletons
  - Atualizar dados a cada 30s (usar `router.refresh()` ou polling leve)

  **Must NOT do**:
  - NÃO buscar dados de todos os usuários (sempre filtrar por userId da sessão)
  - NÃO usar recharts com SSR sem "use client" no componente do gráfico

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Dashboard com métricas, gráficos, cards — trabalho visual
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (com T11, T14)
  - **Blocks**: T13 (relatórios estendem o dashboard)
  - **Blocked By**: T2, T4, T5

  **References**:
  - `C:\QuantumKey\src\` — padrão de Server Components + Suspense (via SSH)
  - recharts docs: `https://recharts.org/en-US/api`
  - shadcn/ui Card, Table: `https://ui.shadcn.com/docs/components/card`

  **Acceptance Criteria**:
  - [ ] Dashboard carrega em < 3s com dados reais do banco
  - [ ] Todos os 4 cards de métricas visíveis
  - [ ] Gráfico renderiza (mesmo que vazio)
  - [ ] Nenhum dado de outros usuários visível (isolamento multi-tenant)

  **QA Scenarios**:
  ```
  Scenario: Dashboard carrega com dados
    Tool: Playwright
    Steps:
      1. Login como admin@test.com
      2. Navigate to http://localhost:3001/dashboard
      3. Wait for selector ".metric-card" ou "[data-testid='dashboard-stats']"
      4. Screenshot full page
    Expected Result: 4 cards de métricas visíveis, sem erros de console
    Evidence: .omo/evidence/task-8-dashboard.png

  Scenario: Isolamento multi-tenant no dashboard
    Tool: Bash
    Steps:
      1. Criar user2@test.com com campanha
      2. Login como admin@test.com
      3. GET /api/dashboard/stats - verificar que dados de user2 NÃO aparecem
    Expected Result: Stats apenas do usuário logado
    Evidence: .omo/evidence/task-8-isolation.txt
  ```

  **Commit**: YES
  - Message: `feat(dashboard): home metrics with campaign stats and wa instance status`

- [x] T9. Criação/edição de campanhas + editor de templates

  **What to do**:
  - Criar `src/app/(dashboard)/campanhas/page.tsx`: lista de campanhas com status + ações
  - Criar `src/app/(dashboard)/campanhas/nova/page.tsx`: wizard de criação em 4 etapas
    - **Etapa 1 — Configuração**: nome da campanha, selecionar instância WA, tipo de mensagem (texto / texto+mídia)
    - **Etapa 2 — Mensagem**: editor de texto com suporte a variáveis ({nome}, {empresa}, + campos do CSV); se mídia: upload de arquivo (image/video/audio/document, max 16MB); preview em tempo real
    - **Etapa 3 — Contatos**: selecionar lista(s) de contatos; exibir contagem total
    - **Etapa 4 — Configurações**: throttle delay (slider 1s-60s, default 3s) _(confirmado na entrevista: "delay anti-ban 1s a 60s")_; agendamento (DateTimePicker, opcional)
  - Criar `src/app/(dashboard)/campanhas/[id]/page.tsx`: detalhe da campanha com progresso em tempo real
  - Criar Server Actions `src/actions/campaigns.ts`:
    - `createCampaign(data)`: validar com Zod, salvar no banco com status DRAFT
    - `startCampaign(campaignId)`: validar instância CONNECTED, enfileirar job BullMQ, mudar status para RUNNING
    - `pauseCampaign(campaignId)`: pausar job BullMQ (job `pause()`)
    - `cancelCampaign(campaignId)`: cancelar + limpar mensagens PENDING _(Constraint técnico: BullMQ — remover jobs da fila `message-send` evita "ghost sends" após cancelamento; ver BullMQ docs: queue.drain())_
    - `scheduleCampaign(campaignId, scheduledFor)`: criar BullMQ delayed job, status SCHEDULED
  - Criar `src/components/campaigns/template-editor.tsx`: textarea com inserção de variáveis via botões
  - Criar `src/components/campaigns/media-upload.tsx`: upload de mídia com preview
  - Upload de mídia: salvar em `public/uploads/[userId]/[filename]` (sem S3 no MVP, volume Docker)

  **Must NOT do**:
  - NÃO iniciar campanha se instância WA não está CONNECTED (validar antes)
  - NÃO permitir envio de arquivo > 16MB (validar no cliente e servidor)
  - NÃO criar campanha com 0 contatos (validar antes)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Wizard multi-step, editor de templates, UI complexa
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (com T5, T6, T7, T10)
  - **Blocks**: T11, T12
  - **Blocked By**: T2, T3, T4

  **References**:
  - shadcn/ui Form + Zod: `https://ui.shadcn.com/docs/components/form`
  - BullMQ delayed jobs: `https://docs.bullmq.io/guide/jobs/delayed`
  - `src/lib/redis.ts` (T3) — usar conexão Redis para BullMQ

  **Acceptance Criteria**:
  - [ ] Criar campanha texto → salva no banco com status DRAFT
  - [ ] Criar campanha com mídia → arquivo salvo em `public/uploads/`
  - [ ] Iniciar campanha com instância desconectada → erro "Instância não conectada"
  - [ ] Agendar campanha para horário passado → toast "Horário passado, disparando imediatamente"

  **QA Scenarios**:
  ```
  Scenario: Criar e iniciar campanha de texto
    Tool: Playwright
    Steps:
      1. Login, navigate to /campanhas/nova
      2. Preencher wizard: nome="Camp Teste", instância conectada, mensagem="Olá {nome}!", selecionar lista com 10 contatos, throttle=3s
      3. Clicar "Criar Campanha"
      4. Na lista, clicar "Iniciar" na campanha criada
    Expected Result: Status muda para RUNNING, progresso aparece (0/10)
    Evidence: .omo/evidence/task-9-campaign-create.png

  Scenario: Agendamento no passado dispara imediatamente
    Tool: Playwright
    Steps:
      1. Criar campanha com scheduledFor = agora - 1 hora
      2. Verificar toast de aviso
      3. Verificar status da campanha
    Expected Result: Toast "Horário passado, disparando imediatamente" + status RUNNING
    Evidence: .omo/evidence/task-9-past-schedule.png
  ```

  **Commit**: YES
  - Message: `feat(campaigns): campaign creation wizard with template editor and scheduling`

- [x] T10. Sistema de webhooks Evolution API → atualização de status

  **What to do**:
  - Criar `src/app/api/webhooks/evolution/route.ts` (POST): endpoint público para receber eventos da Evolution API
  - Processar eventos:
    - `MESSAGES_UPDATE`: atualizar status da Message (SENT/DELIVERED/READ/FAILED) pelo `evolutionMessageId`
    - `CONNECTION_UPDATE`: atualizar status da WaInstance (CONNECTED/DISCONNECTED) pelo instanceName
    - `MESSAGES_UPSERT` (mensagens recebidas): criar InboxMessage
  - Validar assinatura: checar header `apikey` da Evolution API contra `EVOLUTION_API_KEY` env
  - Retornar 200 imediatamente (processar em background via BullMQ se necessário para não bloquear)
  - Criar `src/app/api/webhooks/evolution/config/route.ts` (POST): endpoint para configurar webhook na Evolution API automaticamente ao criar instância
    - Chamar `POST /webhook/set/{instanceName}` na Evolution API com URL do webhook
  - Criar `src/actions/webhook-config.ts`: `configureWebhook(instanceName)` — chamar após criar instância em T6
  - Registrar webhook durante criação de instância: após Evolution API criar instância, chamar `configureWebhook`
  - URL do webhook: `${NEXTAUTH_URL}/api/webhooks/evolution` (variável de ambiente)
  - Criar `src/lib/webhook-processor.ts`: funções para processar cada tipo de evento

  **Must NOT do**:
  - NÃO bloquear a resposta ao webhook (sempre retornar 200 rápido)
  - NÃO processar webhooks sem validar a apikey
  - NÃO atualizar mensagens de outros usuários via webhook (validar instanceName pertence ao tenant correto)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integração crítica, validação de segurança, processamento de eventos assíncronos
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (com T5, T6, T7, T9)
  - **Blocks**: T11, T13
  - **Blocked By**: T2, T3

  **References**:
  - Evolution API webhooks: `https://doc.evolution-api.com/v2/pt/integrations/official/webhooks`
  - Evolution API set webhook: `POST /webhook/set/{instanceName}` com `{url, events: ["MESSAGES_UPDATE","CONNECTION_UPDATE","MESSAGES_UPSERT"]}`
  - `src/lib/evolution-client.ts` (T3) — adicionar método `setWebhook`

  **Acceptance Criteria**:
  - [ ] POST `/api/webhooks/evolution` sem apikey → HTTP 401
  - [ ] POST com evento MESSAGES_UPDATE → Message atualizada no banco em < 1s
  - [ ] POST com CONNECTION_UPDATE desconectado → WaInstance status = DISCONNECTED

  **QA Scenarios**:
  ```
  Scenario: Webhook atualiza status de mensagem
    Tool: Bash
    Steps:
      1. Inserir Message com status=SENT e evolutionMessageId="test-msg-id" no banco
      2. POST http://localhost:3001/api/webhooks/evolution \
           -H "apikey: EVOLUTION_API_KEY" \
           -H "Content-Type: application/json" \
           -d '{"event":"MESSAGES_UPDATE","data":{"key":{"id":"test-msg-id"},"update":{"status":"DELIVERY_ACK"}}}'
      3. Verificar banco: SELECT status FROM "Message" WHERE "evolutionMessageId"='test-msg-id'
    Expected Result: HTTP 200, status = DELIVERED no banco
    Evidence: .omo/evidence/task-10-webhook-status.txt

  Scenario: Webhook sem autenticação rejeitado
    Tool: Bash
    Steps:
      1. curl -X POST http://localhost:3001/api/webhooks/evolution \
           -d '{"event":"test"}' (sem header apikey)
    Expected Result: HTTP 401
    Evidence: .omo/evidence/task-10-webhook-auth.txt
  ```

  **Commit**: YES
  - Message: `feat(webhooks): evolution api webhook handler for message status and connection updates`

- [x] T11. Worker BullMQ — disparo com throttling + variáveis personalizadas

  **What to do**:
  - Criar `workers/src/index.ts`: entry point dos workers com graceful shutdown (SIGTERM/SIGINT)
  - Criar `workers/src/queues.ts`: definir 2 filas BullMQ:
    - `campaign-dispatch`: coordena disparo de campanhas (1 job por campanha)
    - `message-send`: envia cada mensagem individual (1 job por contato)
  - Criar `workers/src/workers/campaign-worker.ts`:
    - Processar job da fila `campaign-dispatch`
    - Buscar campanha no banco com contatos (paginado em chunks de 100)
    - Para cada contato: criar registro Message (status=PENDING) + enfileirar job em `message-send` com delay acumulado
    - Delay acumulado = índice * throttleDelay (confirmado na entrevista: delay 1s-60s por mensagem)
    - Atualizar progresso do job via `job.updateProgress(percent)`
  - Criar `workers/src/workers/message-worker.ts`:
    - Processar job da fila `message-send`
    - Interpolar template com `interpolateTemplate(template, contact.customFields + {nome, empresa})`
    - Se mídia: chamar `evolution.sendMedia(instanceName, payload)`
    - Se só texto: chamar `evolution.sendText(instanceName, number, text)`
    - Salvar `evolutionMessageId` no registro Message
    - Atualizar status Message para SENT (status final via webhook em T10)
    - Em caso de erro: atualizar para FAILED com errorMessage, NÃO fazer retry automático (respeitando anti-ban)
  - Criar `workers/src/lib/prisma.ts` e `workers/src/lib/evolution.ts`: clientes para acesso ao banco e Evolution API
  - Criar `workers/Dockerfile`: node:22-alpine, npm ci, CMD node dist/index.js
  - Atualizar `docker-compose.yml`: serviço `worker` com env DATABASE_URL, REDIS_URL, EVOLUTION_API_URL, EVOLUTION_API_KEY
  - Adicionar `healthcheck` no worker: verificar Redis `PING`

  **Must NOT do**:
  - NÃO usar retry automático em falha de envio (risco de ban)
  - NÃO processar todos os contatos de uma vez (usar chunks de 100 para não explodir memória)
  - NÃO fazer mais de 1 requisição por intervalo de throttle (respeitar delay configurado)
  - NÃO deixar Redis com `maxRetriesPerRequest` diferente de `null` (BullMQ exige)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Worker BullMQ crítico, lógica de throttling, integração Evolution API, múltiplos arquivos
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (com T8, T14)
  - **Blocks**: T12, T13, T15
  - **Blocked By**: T6, T7, T9, T10

  **References**:
  - BullMQ worker docs: `https://docs.bullmq.io/guide/workers`
  - BullMQ delayed jobs: `https://docs.bullmq.io/guide/jobs/delayed`
  - BullMQ graceful shutdown: `https://docs.bullmq.io/guide/workers/graceful-shutdown`
  - `src/lib/evolution-client.ts` (T3) — usar mesmos métodos, replicar para workers/
  - `src/lib/utils.ts` (T3) — importar `interpolateTemplate` no worker

  **Acceptance Criteria**:
  - [ ] `docker compose up worker` → container sobe sem erro
  - [ ] Disparar campanha com 5 contatos + delay 2s → 5 mensagens enviadas com ~2s de intervalo
  - [ ] Falha em 1 contato → status FAILED no banco, outros contatos continuam
  - [ ] Worker reiniciado no meio → jobs PENDING continuam (BullMQ persistência Redis)

  **QA Scenarios**:
  ```
  Scenario: Disparo de campanha completo com throttling
    Tool: Bash
    Steps:
      1. Criar campanha com 3 contatos, throttle=2000ms
      2. Enfileirar job: redis-cli XADD ou via API
      3. docker compose logs worker -f | grep "Message sent" (aguardar ~6s)
      4. SELECT status, "sentAt" FROM "Message" WHERE "campaignId"='ID' ORDER BY "sentAt"
    Expected Result: 3 mensagens SENT com intervalos de ~2s entre cada
    Evidence: .omo/evidence/task-11-throttle.txt

  Scenario: Falha em contato não para campanha
    Tool: Bash
    Steps:
      1. Criar campanha com 3 contatos, 1 com número inválido (sem formato)
      2. Disparar campanha
      3. Verificar banco após conclusão
    Expected Result: 2 mensagens SENT, 1 FAILED, campanha status=COMPLETED
    Evidence: .omo/evidence/task-11-partial-failure.txt
  ```

  **Commit**: YES
  - Message: `feat(worker): bullmq campaign dispatch with throttling and variable interpolation`

- [x] T12. Agendamento de campanhas — UI + BullMQ delayed jobs

  **What to do**:
  - Adicionar campo `scheduledFor` no form de campanha (DateTimePicker com fuso horário)
  - Criar `src/components/campaigns/datetime-picker.tsx`: picker de data/hora com validação
  - Atualizar Server Action `scheduleCampaign(campaignId, scheduledFor)` em `src/actions/campaigns.ts`:
    - Se `scheduledFor` <= agora: disparar imediatamente + toast de aviso "Horário passado, disparando agora"
    - Se `scheduledFor` > agora: enfileirar BullMQ delayed job com `delay = scheduledFor.getTime() - Date.now()`
    - Salvar status SCHEDULED no banco
  - Criar `src/app/(dashboard)/campanhas/agendadas/page.tsx`: lista de campanhas agendadas com countdown
  - Criar `src/components/campaigns/countdown-timer.tsx`: timer em tempo real (client component)
  - Criar `workers/src/workers/scheduled-campaign-worker.ts`: processar fila `campaign-scheduled`
    - Quando job disparar: mover campanha para fila `campaign-dispatch` (reutilizar T11)
    - Atualizar status de SCHEDULED → RUNNING
  - Criar `src/app/api/campaigns/[id]/schedule/route.ts` (POST): endpoint REST que chama `scheduleCampaign` — necessário para QA com curl
  - Adicionar à lista de campanhas: badge "Agendada para DD/MM HH:MM" nas campanhas SCHEDULED
  - Cancelamento de agendamento: remover job BullMQ + status DRAFT

  **Must NOT do**:
  - NÃO criar novo fluxo de envio (reutilizar worker de T11)
  - NÃO perder jobs agendados em restart do worker (Redis persiste os delayed jobs)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integração BullMQ delayed, lógica de fuso horário, UI de scheduling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (com T13; forçado por deps T9+T11)
  - **Blocks**: T15
  - **Blocked By**: T9, T11

  **References**:
  - BullMQ delayed jobs: `https://docs.bullmq.io/guide/jobs/delayed`
  - date-fns: `https://date-fns.org/docs/Getting-Started`
  - shadcn/ui Calendar + Popover para DateTimePicker

  **Acceptance Criteria**:
  - [ ] Agendar campanha para +5min → status SCHEDULED, job criado no Redis
  - [ ] Após 5min → status muda para RUNNING automaticamente
  - [ ] Agendar para horário passado → toast de aviso + dispara imediatamente

  **QA Scenarios**:
  ```
  Scenario: Agendamento futuro cria job BullMQ
    Tool: Bash
    Steps:
      1. POST /api/campaigns/ID/schedule com scheduledFor = agora + 60s
      2. redis-cli ZRANGE bull:campaign-scheduled:delayed 0 -1 WITHSCORES
    Expected Result: job presente no Redis com score = timestamp futuro
    Evidence: .omo/evidence/task-12-schedule-redis.txt

  Scenario: Agendamento passado dispara imediatamente com aviso
    Tool: Playwright
    Steps:
      1. Criar campanha, definir data de ontem no picker
      2. Clicar "Agendar"
      3. Wait for toast notification
    Expected Result: Toast contendo "passado" ou "imediatamente", status = RUNNING
    Evidence: .omo/evidence/task-12-past-schedule.png
  ```

  **Commit**: YES
  - Message: `feat(schedule): campaign scheduling with BullMQ delayed jobs and past-time handling`

- [x] T13. Relatórios de entrega em tempo real

  **What to do**:
  - Criar `src/app/(dashboard)/campanhas/[id]/relatorio/page.tsx`: relatório detalhado da campanha
  - Métricas em tempo real:
    - Progresso geral: barra de progresso (X mensagens de Y total)
    - Cards: Enviadas, Entregues, Lidas, Falhas — com percentual
    - Tabela de mensagens: telefone, nome (do contato), status badge, timestamp
    - Gráfico de dispersão temporal (recharts): quando cada msg foi enviada/entregue/lida
  - Atualização em tempo real: polling a cada 5s via `router.refresh()` ou SWR com revalidation
  - Criar `src/app/api/campaigns/[id]/stats/route.ts` (GET): retornar stats agregadas da campanha
    - Query: COUNT messages por status, último update, tempo estimado de conclusão
  - Criar `src/components/reports/delivery-chart.tsx`: gráfico de entregas ao longo do tempo
  - Criar `src/components/reports/message-table.tsx`: tabela com paginação (50/página) e filtro por status
  - Exportar relatório: botão "Exportar CSV" → gerar CSV com todas as mensagens e status

  **Must NOT do**:
  - NÃO fazer polling mais frequente que 5s (evitar sobrecarga)
  - NÃO buscar dados de campanhas de outros usuários (validar userId)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI de relatórios, gráficos, tabela paginada, dados em tempo real
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (com T12; forçado por deps T8+T11)
  - **Blocks**: T15
  - **Blocked By**: T10, T11

  **References**:
  - recharts LineChart: `https://recharts.org/en-US/api/LineChart`
  - shadcn/ui Table com paginação: `https://ui.shadcn.com/docs/components/data-table`

  **Acceptance Criteria**:
  - [ ] Relatório carrega com stats corretas do banco
  - [ ] Cards atualizam automaticamente a cada 5s durante campanha RUNNING
  - [ ] Exportar CSV → download de arquivo com todas as mensagens
  - [ ] Filtro por status funciona na tabela de mensagens

  **QA Scenarios**:
  ```
  Scenario: Relatório mostra progresso em tempo real
    Tool: Playwright
    Steps:
      1. Iniciar campanha com 5 contatos
      2. Navigate to /campanhas/ID/relatorio
      3. Screenshot a cada 3s por 15s (3 screenshots)
    Expected Result: Contador de "Enviadas" aumenta entre screenshots
    Evidence: .omo/evidence/task-13-realtime-1.png, task-13-realtime-2.png, task-13-realtime-3.png

  Scenario: Export CSV funciona
    Tool: Playwright
    Steps:
      1. Navigate to /campanhas/ID/relatorio (campanha COMPLETED)
      2. Click button "Exportar CSV"
      3. Wait for download
    Expected Result: Arquivo CSV baixado com colunas: telefone, nome, status, sentAt
    Evidence: .omo/evidence/task-13-export.csv
  ```

  **Commit**: YES
  - Message: `feat(reports): real-time delivery reports with charts and CSV export`

- [x] T14. Inbox de respostas somente leitura

  **What to do**:
  - Criar `src/app/(dashboard)/inbox/page.tsx`: lista de mensagens recebidas
  - Layout: sidebar com filtro por instância WA + lista de conversas + painel de mensagem
  - Criar `src/app/(dashboard)/inbox/[instanceId]/page.tsx`: mensagens de uma instância específica
  - Buscar InboxMessages do banco (criadas pelo webhook de T10): `SELECT * FROM "InboxMessage" WHERE userId = ? ORDER BY receivedAt DESC`
  - Exibir: foto (placeholder avatar), número de telefone, corpo da mensagem, timestamp
  - Badge de "não lido": marcar InboxMessage com campo `isRead` (bool, default false)
  - Criar Server Action `markAsRead(messageId)`: atualizar isRead=true
  - Adicionar badge de contagem no link "Inbox" da sidebar (mensagens não lidas)
  - Sem campo de resposta (somente leitura — guardrail do Metis)
  - Banner visível na UI: "Modo leitura — resposta pelo WhatsApp diretamente no seu celular"

  **Must NOT do**:
  - NÃO criar campo de envio de mensagem no inbox (MVP somente leitura)
  - NÃO exibir mensagens de instâncias de outros usuários

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI de inbox tipo chat, somente leitura, sem lógica complexa de backend
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (com T8, T11)
  - **Blocks**: T15
  - **Blocked By**: T10

  **References**:
  - shadcn/ui ScrollArea para lista de mensagens
  - InboxMessage model (definido em T2 no schema Prisma)

  **Acceptance Criteria**:
  - [ ] Inbox exibe mensagens recebidas ordenadas por data
  - [ ] Badge na sidebar mostra contagem de não lidas
  - [ ] Clicar em mensagem marca como lida + badge diminui
  - [ ] Banner "Modo leitura" visível, sem campo de envio

  **QA Scenarios**:
  ```
  Scenario: Inbox exibe mensagens recebidas
    Tool: Playwright
    Steps:
      1. Inserir 3 InboxMessages no banco via Prisma (userId do usuário logado)
      2. Navigate to http://localhost:3001/inbox
      3. Screenshot
    Expected Result: 3 mensagens visíveis, badge "3" na sidebar
    Evidence: .omo/evidence/task-14-inbox.png

  Scenario: Inbox NÃO tem campo de resposta
    Tool: Playwright
    Steps:
      1. Navigate to /inbox
      2. Check that NO input, textarea or button with "enviar"/"reply"/"responder" exists
    Expected Result: Nenhum campo de envio presente, banner "Modo leitura" visível
    Evidence: .omo/evidence/task-14-readonly.png
  ```

  **Commit**: YES
  - Message: `feat(inbox): read-only inbox for received WhatsApp messages`

- [x] T15. Deploy na VPS Quantum Key

  **What to do**:
  - Conectar na VPS via SSH (`ssh server`)
  - Criar pasta: `mkdir -p /c/projetos/disparoswpp`
  - Clonar repositório: `git clone https://github.com/peubraw/disparoswpp /c/projetos/disparoswpp`
  - Criar `/c/projetos/disparoswpp/.env` com todas as variáveis:
    - `DATABASE_URL=postgresql://disparos:SENHA@postgres:5432/disparoswpp`
    - `NEXTAUTH_SECRET=` (gerar com `openssl rand -base64 32`)
    - `NEXTAUTH_URL=http://IP_VPS:3001`
    - `EVOLUTION_API_URL=http://evolution-api:8081`
    - `EVOLUTION_API_KEY=` (gerar chave forte)
    - `REDIS_URL=redis://redis:6379`
    - `POSTGRES_PASSWORD=` (senha forte)
  - Rodar `docker compose build` (aguardar conclusão)
  - Rodar `docker compose up -d` (subir todos os serviços)
  - Aguardar postgres healthcheck passar: `docker compose ps` → todos "healthy" ou "running"
  - Rodar migrations: `docker compose exec app npx prisma migrate deploy`
  - Rodar seed: `docker compose exec app npm run db:seed`
  - Verificar logs: `docker compose logs app --tail=50`
  - Testar acesso: `curl http://localhost:3001` → deve retornar HTML

  **Must NOT do**:
  - NÃO commitar `.env` com credenciais no repositório
  - NÃO usar senha "123456" ou "postgres" em produção
  - NÃO expor porta 5433 (postgres) ou 6380 (redis) publicamente (apenas na rede Docker)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Deploy em VPS real via SSH, múltiplos comandos, verificação de saúde de serviços
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NÃO (deploy é sequencial após todos os features)
  - **Parallel Group**: Wave 6 (sozinho, após todas as features)
  - **Blocks**: T16, F1-F4
  - **Blocked By**: T11, T12, T13, T14

  **References**:
  - Acesso SSH VPS: `ssh server` (host configurado em ~/.ssh/config como 100.119.51.84:22)
  - docker-compose.yml criado em T1
  - QuantumKey deploy pattern: `ssh server "cd /c/QuantumKey && docker compose up -d"`
  - QuantumKey Dockerfile multi-stage: referência para verificar build funciona

  **Acceptance Criteria**:
  - [ ] `docker compose ps` na VPS → 5 serviços "running" ou "healthy"
  - [ ] `curl http://localhost:3001` na VPS → HTTP 200 ou 307
  - [ ] `curl http://localhost:8081` na VPS → Evolution API responde com JSON
  - [ ] `docker compose exec postgres pg_isready` → "accepting connections"

  **QA Scenarios**:
  ```
  Scenario: Todos os containers sobem na VPS
    Tool: Bash (via SSH)
    Steps:
      1. ssh server "cd /c/projetos/disparoswpp && docker compose ps"
    Expected Result: 5 serviços listados, todos com status "running" ou "healthy"
    Evidence: .omo/evidence/task-15-docker-ps.txt

  Scenario: App acessível na porta 3001
    Tool: Bash (via SSH)
    Steps:
      1. ssh server "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001"
    Expected Result: "200" ou "307" (redirect para /login)
    Evidence: .omo/evidence/task-15-app-accessible.txt

  Scenario: Migration aplicada com sucesso
    Tool: Bash (via SSH)
    Steps:
      1. ssh server "docker compose -f /c/projetos/disparoswpp/docker-compose.yml exec postgres psql -U disparos -d disparoswpp -c '\\dt'"
    Expected Result: Lista de tabelas: User, WaInstance, Campaign, Message, Contact, ContactList, InboxMessage
    Evidence: .omo/evidence/task-15-tables.txt
  ```

  **Commit**: YES
  - Message: `chore(deploy): vps setup script and deployment documentation`

- [x] T16. Smoke tests end-to-end na VPS

  **What to do**:
  - Executar o fluxo completo de ponta a ponta na VPS real (não localhost):
    1. Acessar `http://IP_VPS:3001` → página de login
    2. Criar conta de teste
    3. Criar instância WA (verificar se QR code aparece)
    4. Criar lista de contatos (upload de CSV de teste com 5 números — usar números próprios)
    5. Criar campanha de texto com variáveis
    6. Iniciar campanha → verificar que worker processa
    7. Verificar relatório de entrega
    8. Verificar inbox (se houver resposta)
  - Verificar persistência de sessão: `docker compose restart` → sessões WA permanecem
  - Verificar que containers reiniciam automaticamente: `docker compose stop app && docker compose start app`
  - Documentar URL de acesso no README.md
  - Criar `README.md` com instruções de: instalação local, deploy VPS, variáveis de ambiente

  **Must NOT do**:
  - NÃO enviar mensagens para números de pessoas sem consentimento (usar números próprios)
  - NÃO commitar logs ou dumps de banco no repositório

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Testes E2E em ambiente real, verificação de persistência, documentação
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NÃO (smoke test após deploy)
  - **Parallel Group**: Wave 7 (sozinho, após T15)
  - **Blocks**: F1-F4
  - **Blocked By**: T15

  **References**:
  - IP da VPS: obtido via `ssh server "curl -s ifconfig.me"` ou configurado no .env

  **Acceptance Criteria**:
  - [ ] Fluxo completo (criar conta → conectar WA → criar campanha → disparar) executado sem erro
  - [ ] `docker compose restart` → instâncias WA persistem (não precisam re-escanear QR)
  - [ ] `README.md` criado com instruções claras

  **QA Scenarios**:
  ```
  Scenario: Fluxo completo de campanha na VPS
    Tool: Playwright (apontado para http://IP_VPS:3001)
    Steps:
      1. Navigate to http://IP_VPS:3001/register
      2. Criar conta com email real de teste
      3. Navigate to /instancias/nova — criar instância
      4. Screenshot do QR code
      5. Navigate to /contatos/nova — criar lista com 2 contatos (números próprios)
      6. Navigate to /campanhas/nova — criar campanha "Teste Deploy"
      7. Iniciar campanha
      8. Navigate to /campanhas/ID/relatorio — aguardar 30s
      9. Screenshot do relatório
    Expected Result: Campanha COMPLETED, pelo menos 1 mensagem SENT ou DELIVERED
    Evidence: .omo/evidence/task-16-e2e-vps.png

  Scenario: Persistência após restart
    Tool: Bash (via SSH)
    Steps:
      1. Verificar instância WA conectada: docker compose exec app curl http://evolution-api:8081/instance/connectionState/NOME
      2. docker compose -f /c/projetos/disparoswpp/docker-compose.yml restart
      3. Aguardar 30s: sleep 30
      4. Verificar novamente: mesma chamada
    Expected Result: Status CONNECTED antes e depois do restart
    Evidence: .omo/evidence/task-16-persistence.txt
  ```

  **Commit**: YES
  - Message: `docs: readme with setup instructions and deployment guide`

---

## Final Verification Wave

> 4 revisores em paralelo. TODOS devem APROVAR. Apresentar resultados consolidados e aguardar "okay" explícito antes de concluir.

- [ ] F1. **Auditoria de Conformidade do Plano** — `oracle`
  Ler o plano inteiro. Para cada "Must Have": verificar que implementação existe (ler arquivo, curl endpoint, rodar comando). Para cada "Must NOT Have": buscar padrões proibidos no codebase — rejeitar com file:line se encontrado. Verificar que arquivos de evidência existem em .omo/evidence/. Comparar entregáveis com o plano.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`
  **Acceptance Criteria**: Output final deve conter `VERDICT: APPROVE`. Qualquer `REJECT` bloqueia conclusão.

- [ ] F2. **Revisão de Qualidade de Código** — `unspecified-high`
  Rodar `npx tsc --noEmit` + `npm run lint`. Revisar todos os arquivos alterados: `as any`/`@ts-ignore`, catches vazios, console.log em prod, código comentado, imports não usados. Verificar AI slop: comentários excessivos, sobre-abstração, nomes genéricos (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`
  **Acceptance Criteria**: `Build [PASS]` + `Lint [PASS]` + `VERDICT: PASS`. Qualquer `FAIL` bloqueia.

- [ ] F3. **QA Manual Real End-to-End** — `unspecified-high` + skill `playwright`
  Iniciar do estado limpo. Executar TODOS os cenários QA de TODAS as tasks — seguir passos exatos, capturar evidências. Testar integração cross-task (features trabalhando juntas). Salvar em `.omo/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`
  **Acceptance Criteria**: `Scenarios [N/N pass]` (100%) + `VERDICT: PASS`. Qualquer cenário com FAIL bloqueia.

- [ ] F4. **Verificação de Fidelidade de Escopo** — `deep`
  Para cada task: ler "What to do", ler diff real (git log/diff). Verificar 1:1 — tudo no spec foi construído (sem missing), nada além do spec foi construído (sem creep). Checar "Must NOT do". Detectar contaminação cross-task. Flaggar mudanças sem origem.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`
  **Acceptance Criteria**: `Tasks [N/N compliant]` + `Contamination [CLEAN]` + `VERDICT: COMPLIANT`. Qualquer `NON-COMPLIANT` bloqueia.

---

## Commit Strategy

- **Wave 1**: `chore(init): project scaffolding + docker-compose`
- **Wave 2**: `chore(schema): prisma schema + types + shadcn setup`
- **Wave 3**: `feat(auth): nextauth v5 credentials`; `feat(wa): whatsapp instance management + QR code`; `feat(contacts): CSV import + contact lists`; `feat(campaigns): campaign creation + template editor`; `feat(webhooks): evolution api webhook handler`
- **Wave 4**: `feat(dashboard): home metrics dashboard`; `feat(worker): bullmq dispatch worker with throttling`; `feat(inbox): read-only inbox`
- **Wave 5**: `feat(schedule): campaign scheduling + delayed jobs`; `feat(reports): delivery reports real-time`
- **Wave 6-7**: `chore(deploy): vps setup + smoke tests`

---

## Success Criteria

### Verification Commands
```bash
# Containers todos rodando
docker compose ps  # Expected: 5 services, all "running"

# App acessível
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001  # Expected: 200 ou 307

# Evolution API saudável
curl -s http://localhost:8081/  # Expected: JSON com version

# PostgreSQL respondendo
docker compose exec postgres pg_isready -U disparos  # Expected: "accepting connections"

# Redis respondendo
docker compose exec redis redis-cli ping  # Expected: PONG

# TypeScript sem erros
npx tsc --noEmit  # Expected: sem output (0 erros)
```

### Final Checklist
- [ ] Todos os "Must Have" presentes e verificados
- [ ] Todos os "Must NOT Have" ausentes no codebase
- [ ] `docker compose up -d` funciona do zero na VPS
- [ ] Fluxo completo: cadastro → conectar WA → importar CSV → criar campanha → disparar → ver relatório
- [ ] Sessões WA persistem após `docker compose restart`
