# Melhorias disparoswpp — CSV Import, Campaign COMPLETED, Pause/Resume, Inbox Reply

## TL;DR

> **Quick Summary**: Adicionar 4 melhorias ao disparoswpp: importação CSV com mapeamento de colunas e deduplicação robusta, campanha que chega automaticamente a COMPLETED via job BullMQ, pause/resume correto que remove jobs da fila, e resposta a mensagens no inbox.
>
> **Deliverables**:
> - CSV import com ColumnMapper wired, unique constraint no DB, botão "Validar Números"
> - finalize-campaign BullMQ job que transiciona campanha para COMPLETED
> - pauseCampaign remove jobs da fila + resumeCampaign re-enfileira a partir de PENDING Messages existentes
> - sendReply Server Action + send-reply worker + UI inline no inbox
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 4 → Task 5 (CSV branch) | Task 1 → Task 7 → Task 8 (campaign branch) | Task 7 → Task 10 → Task 11 (resume branch) | Task 12 → Task 13 → Task 14 (reply branch) → F1-F4

---

## Context

### Original Request
Importação de contatos (CSV + validação + dedup + campos custom) e melhorias na plataforma (campanha COMPLETED, pause/resume, inbox com resposta, agendamento polish).

### Interview Summary
- **CSV import**: UI já tem CsvUpload + ColumnMapper mas estão desconectados. API route existe mas não recebe mapeamento do usuário. Dedup com skipDuplicates não funciona sem unique constraint no DB.
- **COMPLETED**: Apenas o worker legado (src/lib/campaign-worker.ts) seta COMPLETED. Workers de produção (workers/) jamais setam. Campanhas ficam RUNNING para sempre.
- **Pause/Resume**: pauseCampaign só atualiza DB, não remove jobs da fila. resumeCampaign não existe; startCampaign é reutilizado mas cria Message rows duplicadas.
- **Inbox reply**: read-only by design. Nenhuma Server Action ou worker suporta envio de reply.
- **Scheduling**: funcional. Polish = apenas COMPLETED transition (coberta pela Feature 2).

### Metis Review — Gaps Resolvidos
- ColumnMapper desconectado do CsvUpload → será conectado (Task 5)
- Unique constraint sem migração de limpeza → dois passos (Task 1 + Task 2)
- resumeCampaign não pode chamar startCampaign → nova Server Action re-enfileira de PENDING Messages existentes (Task 10)
- finalize-campaign com PENDING remanescentes → re-enfileira a si mesmo com 60s delay (Task 7)
- Inbox reply via evolutionClient direto violaria arquitetura → vai via BullMQ queue (Tasks 12-15)

---

## Work Objectives

### Core Objective
Adicionar importação CSV robusta, transição automática de campanha para COMPLETED, pause/resume correto sem duplicatas, e resposta de inbox via fila BullMQ — tudo respeitando a arquitetura existente de Server Actions + workers isolados.

### Concrete Deliverables
- `prisma/schema.prisma`: `@@unique([contactListId, phoneNumber])` + migration
- `src/app/api/contacts/import/route.ts`: aceita campo `mapping` JSON no FormData
- `src/components/contacts/csv-upload.tsx`: usa ColumnMapper e envia mapping
- `src/lib/evolution-client.ts`: método `validateNumbers(instance, phones[])`
- `src/app/(dashboard)/contatos/[listId]/page.tsx`: botão "Validar Números"
- `workers/src/workers/campaign-worker.ts`: enfileira finalize-campaign após dispatch
- `workers/src/workers/finalize-campaign-worker.ts`: novo handler
- `workers/src/index.ts`: registra finalize-campaign handler
- `src/actions/campaigns.ts`: `pauseCampaign` remove jobs + `resumeCampaign` novo
- `src/components/campaigns/campaign-actions.tsx`: botão Retomar
- `src/actions/inbox.ts`: `sendReply(inboxMessageId, text)`
- `workers/src/workers/reply-worker.ts`: handler send-reply
- `src/components/inbox/message-item.tsx`: inline reply form

### Must Have
- Unique constraint no DB com deduplicação prévia dos dados existentes
- ColumnMapper conectado ao CsvUpload, mapping enviado à API
- finalize-campaign re-enfileira com 60s delay se houver PENDING restantes
- pauseCampaign remove waiting/delayed send-message jobs da fila
- resumeCampaign consulta Message PENDING existentes, nunca cria duplicatas
- sendReply via fila BullMQ (nunca direto evolutionClient da Server Action)
- Botão "Validar Números" na página da lista de contatos

### Must NOT Have (Guardrails)
- Nunca editar `src/components/ui/` — usar `npx shadcn add`
- Nunca adicionar mutações em API routes — usar Server Actions (exceto import de arquivo que já existe como API route)
- Nunca importar código de `workers/` em `src/`
- Nunca usar `auth()` no middleware — usar `getToken()`
- Nunca modificar `src/lib/campaign-worker.ts` (worker legado)
- Nunca chamar `evolutionClient` diretamente de Server Action para inbox reply
- Nunca chamar `startCampaign` de `resumeCampaign` (cria Message rows duplicadas)
- Nunca adicionar background job processing para imports CSV (manter síncrono 10k)
- Nunca mover import CSV para Server Action (body size implications)
- Nunca construir threading/histórico de conversa no inbox
- Nunca adicionar novo enum `CANCELLED` no CampaignStatus
- Não implementar reagendamento (alterar scheduled time após definir)
- Não validar números WA automaticamente no import (somente botão explícito)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Agent-Executed QA**: SEMPRE (obrigatório para todas as tasks)

### QA Policy
- **API/Backend**: Bash (curl) — requisições, status codes, response bodies
- **UI/Frontend**: Playwright — navegação, formulários, assertions DOM
- **Workers/Queue**: Bash (redis-cli + psql) — verificar jobs e status no DB
- Evidence: `.omo/evidence/task-{N}-{slug}.{ext}`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1A (Iniciar imediatamente — sem dependências):
├── Task 1: Migração DB — deduplicar contatos existentes [quick]
└── Task 3: evolution-client.ts — método validateNumbers() [quick]

Wave 1B (Após Task 1 — adicionar unique constraint):
└── Task 2: Schema — adicionar @@unique([contactListId, phoneNumber]) [quick]

Wave 2A (Após Tasks 1+2 e Task 3 — paralelo máximo real):
├── Task 4: API import route — aceitar campo mapping JSON (depende: 2) [quick]
├── Task 6: Página lista contatos — botão Validar Números (depende: 3) [quick]
├── Task 7: finalize-campaign worker — novo handler (depende: 1) [unspecified-high]
├── Task 9: pauseCampaign — remover jobs da fila (depende: 1) [quick]
└── Task 12: sendReply Server Action (sem dependência de wave anterior) [quick]

Wave 2B (Após Tasks 4, 7, 9, 12):
├── Task 5: CsvUpload + ColumnMapper — conectar e enviar mapping (depende: 4) [unspecified-high]
├── Task 8: campaign-worker — enfileirar finalize-campaign (depende: 7) [quick]
├── Task 10: resumeCampaign — nova Server Action (depende: 7, 9) [unspecified-high]
└── Task 13: reply-worker.ts — handler send-reply (depende: 12) [quick]

Wave 2C (Após Tasks 10, 13):
├── Task 11: campaign-actions.tsx — botão Retomar (depende: 10) [quick]
├── Task 14: workers/index.ts — registrar finalize + reply handlers (depende: 7, 13) [quick]
└── Task 15: MessageItem — inline reply form (depende: 12) [unspecified-high]

Wave FINAL (Após todas as tasks):
├── F1: Plan Compliance Audit (oracle)
├── F2: Code Quality Review (unspecified-high)
├── F3: Real Manual QA (unspecified-high + playwright)
└── F4: Scope Fidelity Check (deep)
→ Apresentar resultados → Aguardar aprovação explícita do usuário
```

### Agent Dispatch Summary
- Wave 1A: 2 tasks → `quick` × 2 (Tasks 1, 3)
- Wave 1B: 1 task → `quick` × 1 (Task 2)
- Wave 2A: 5 tasks → `quick` × 4, `unspecified-high` × 1 (Tasks 4, 6, 7, 9, 12)
- Wave 2B: 4 tasks → `quick` × 2, `unspecified-high` × 2 (Tasks 5, 8, 10, 13)
- Wave 2C: 3 tasks → `quick` × 2, `unspecified-high` × 1 (Tasks 11, 14, 15)
- Final: 4 reviewers paralelos (F1-F4)

---

## TODOs

- [x] 1. Migração DB — deduplicar contatos existentes antes de adicionar unique constraint

  **What to do**:
  - Criar migration SQL em `prisma/migrations/` que deleta duplicatas de Contact mantendo o registro mais antigo por `(contactListId, phoneNumber)`
  - SQL: `DELETE FROM "Contact" WHERE id NOT IN (SELECT MIN(id) FROM "Contact" GROUP BY "contactListId", "phoneNumber")`
  - Executar via `npx prisma migrate dev --name dedup_contacts`

  **Must NOT do**:
  - Não adicionar o `@@unique` ainda (isso é Task 2)
  - Não deletar a tabela inteira

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1A (com Task 3)
  - **Blocks**: Tasks 2, 4, 7, 9
  - **Blocked By**: None

  **References**:
  - `prisma/schema.prisma` — modelo Contact, campo phoneNumber
  - `prisma/migrations/` — padrão das migrations existentes

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Deduplicação não quebra dados existentes
    Tool: Bash (psql)
    Steps:
      1. docker exec disparoswpp-postgres-1 psql -U disparos -d disparoswpp -c "SELECT COUNT(*) FROM \"Contact\";"
      2. npx prisma migrate deploy
      3. docker exec disparoswpp-postgres-1 psql -U disparos -d disparoswpp -c "SELECT COUNT(*) FROM \"Contact\";"
    Expected Result: Contagem igual ou menor (nunca maior). Nenhum erro na migration.
    Evidence: .omo/evidence/task-1-dedup-migration.txt
  ```

  **Commit**: YES — `feat(contacts): dedup migration before unique constraint`

- [x] 2. Schema — adicionar @@unique([contactListId, phoneNumber])

  **What to do**:
  - Em `prisma/schema.prisma`, no model Contact, adicionar: `@@unique([contactListId, phoneNumber])`
  - Rodar `npx prisma migrate dev --name unique_contact_phone`
  - Confirmar que o campo `@@index([contactListId])` existente pode coexistir com o unique

  **Must NOT do**:
  - Não fazer isso antes da Task 1 (migration de dedup)
  - Não remover o @@index existente

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial após Task 1)
  - **Parallel Group**: Wave 1B (sozinha, após Task 1 completar)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:
  - `prisma/schema.prisma:Contact` — modelo atual
  - `src/app/api/contacts/import/route.ts` — usa createMany com skipDuplicates (agora vai funcionar com unique constraint)

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Unique constraint impede duplicatas
    Tool: Bash (psql)
    Steps:
      1. npx prisma migrate deploy
      2. docker exec disparoswpp-postgres-1 psql -U disparos -d disparoswpp -c "SELECT indexname FROM pg_indexes WHERE tablename='Contact' AND indexdef LIKE '%phoneNumber%contactListId%';"
    Expected Result: Retorna 1 índice único.
    Evidence: .omo/evidence/task-2-unique-constraint.txt
  ```

  **Commit**: YES (junto com Task 1) — `feat(contacts): add unique constraint on (contactListId, phoneNumber)`

- [x] 3. evolution-client.ts — método validateNumbers()

  **What to do**:
  - Em `src/lib/evolution-client.ts`, adicionar método `validateNumbers(instanceName: string, phones: string[]): Promise<Array<{ number: string; exists: boolean }>>`
  - Endpoint: `POST /chat/whatsappNumbers/{instanceName}` com body `{ numbers: phones }`
  - Mapear resposta: array de objetos com `number` e `exists` (campo `numberExists` na resposta da Evolution API v2)
  - Aplicar retry existente (3 tentativas, backoff exponencial) igual aos outros métodos

  **Must NOT do**:
  - Não chamar este método de Server Actions diretamente sem tratamento de erro
  - Não expor a EVOLUTION_API_KEY na resposta

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1A (com Task 1)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:
  - `src/lib/evolution-client.ts` — padrão dos métodos existentes (sendText, sendMedia, getInstances)
  - Evolution API v2.3.7 docs: endpoint `POST /chat/whatsappNumbers/{instance}`, body `{ numbers: ["5511..."] }`, response `[{ number, numberExists }]`

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: validateNumbers retorna exists=true para número válido
    Tool: Bash (curl via Evolution API direto)
    Steps:
      1. curl -s -X POST http://localhost:8081/chat/whatsappNumbers/NewBraw -H "apikey: EvolutionKey2025Disparos" -H "Content-Type: application/json" -d '{"numbers":["5584986957575"]}'
    Expected Result: JSON com numberExists: true para o número testado.
    Evidence: .omo/evidence/task-3-validate-numbers.txt
  ```

  **Commit**: YES — `feat(contacts): add validateNumbers to evolution-client`

- [x] 4. API import route — aceitar campo mapping JSON no FormData

  **What to do**:
  - Em `src/app/api/contacts/import/route.ts`, ler campo `mapping` do FormData: `const mappingRaw = formData.get("mapping") as string | null`
  - Parsear como `Record<string, string>` (ex: `{ "0": "phoneNumber", "2": "name", "3": "customField_empresa" }`) — chave = índice da coluna CSV, valor = campo destino
  - Se `mapping` presente, usar em vez da auto-detecção de colunas
  - Manter auto-detecção como fallback se `mapping` ausente
  - Com unique constraint (Task 2), `skipDuplicates: true` agora funcionará corretamente
  - Retornar `{ imported, duplicates, errors }` como antes

  **Must NOT do**:
  - Não quebrar imports existentes sem mapping
  - Não retornar Prisma errors raw — mapear para strings em português

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (com Tasks 6, 7, 9, 12 — após Tasks 1+2)
  - **Parallel Group**: Wave 2A
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `src/app/api/contacts/import/route.ts` — implementação atual completa
  - `src/components/contacts/column-mapper.tsx` — formato de mapping que o ColumnMapper produz

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Import com mapping customizado
    Tool: Bash (curl)
    Steps:
      1. Criar CSV: "celular,empresa\n5511999999999,Acme"
      2. curl -X POST https://painel.quantumkey.com.br/disparoswpp/api/contacts/import -F "file=@test.csv" -F "listId=<listId>" -F 'mapping={"0":"phoneNumber","1":"customField_empresa"}'
    Expected Result: {"imported":1,"duplicates":0,"errors":0}. Contact criado com phoneNumber="5511999999999" e customFields={"empresa":"Acme"}.
    Evidence: .omo/evidence/task-4-import-with-mapping.txt

  Scenario: Import duplicado retorna duplicates>0
    Tool: Bash (curl)
    Steps:
      1. Rodar o mesmo curl acima duas vezes
    Expected Result: Segunda chamada retorna {"imported":0,"duplicates":1,"errors":0}.
    Evidence: .omo/evidence/task-4-import-duplicate.txt
  ```

  **Commit**: YES — `feat(contacts): import route accepts column mapping`

- [x] 5. CsvUpload + ColumnMapper — conectar e enviar mapping ao import

  **What to do**:
  - Em `src/components/contacts/csv-upload.tsx`:
    - Após parse do CSV (preview das primeiras linhas), mostrar `ColumnMapper` com as colunas detectadas
    - Aguardar usuário confirmar/ajustar mapping antes de habilitar botão "Importar"
    - Ao submeter, incluir `mapping` como JSON string no FormData: `formData.append("mapping", JSON.stringify(userMapping))`
  - Em `src/components/contacts/column-mapper.tsx`:
    - Verificar interface atual e garantir que `onChange` devolve `Record<string, string>` (índice coluna → campo destino)
    - Campos destino possíveis: `phoneNumber`, `name`, `customField_{qualquerNome}`
  - Manter UX dark/futurista existente, Orbitron para headings se usados

  **Must NOT do**:
  - Não editar `src/components/ui/` — usar shadcn primitivos existentes
  - Não re-implementar ColumnMapper do zero — conectar o existente

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2B — após Task 4)
  - **Blocks**: nenhum
  - **Blocked By**: Task 4

  **References**:
  - `src/components/contacts/csv-upload.tsx` — implementação atual
  - `src/components/contacts/column-mapper.tsx` — componente existente (desconectado)
  - `src/app/(dashboard)/contatos/nova/page.tsx` — onde CsvUpload é usado
  - UI theme: `#0a0f0d` bg, `#25D366` primary, shadcn/ui primitivos

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: ColumnMapper aparece após upload e permite ajustar mapping
    Tool: Playwright
    Steps:
      1. Navegar para /disparoswpp/contatos/nova
      2. Criar lista, fazer upload de CSV com header "celular,nome,empresa"
      3. Verificar que ColumnMapper aparece com 3 colunas listadas
      4. Mapear "celular" → phoneNumber, "nome" → name, "empresa" → customField_empresa
      5. Clicar Importar
    Expected Result: Toast de sucesso. Contato criado com campos corretos no DB.
    Evidence: .omo/evidence/task-5-column-mapper.png
  ```

  **Commit**: YES — `feat(contacts): wire ColumnMapper into CsvUpload`

- [x] 6. Página lista contatos — botão "Validar Números"

  **What to do**:
  - Em `src/app/(dashboard)/contatos/[listId]/page.tsx`, adicionar botão "Validar Números" na área de ações
  - Criar Server Action `validateContactListNumbers(listId: string)` em `src/actions/contacts.ts`:
    - Busca todos os contatos da lista
    - Chama `evolutionClient.validateNumbers(instanceName, phones)` — usar a primeira instância conectada do usuário (buscar via `prisma.waInstance.findFirst({ where: { userId, status: "CONNECTED" } })`)
    - Retorna `{ valid: number, invalid: number, invalidPhones: string[] }`
  - UI exibe resultado em modal ou toast com contagem e lista de inválidos

  **Must NOT do**:
  - Não fazer validação automática no import
  - Não expor API key
  - Não editar src/components/ui/

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2A — com Tasks 4, 7, 9, 12)
  - **Blocks**: nenhum
  - **Blocked By**: Task 3

  **References**:
  - `src/app/(dashboard)/contatos/[listId]/page.tsx` — página atual
  - `src/actions/contacts.ts` — padrão das Server Actions (getCurrentUser, ownership check, revalidatePath)
  - `src/lib/evolution-client.ts` — método validateNumbers (Task 3)
  - `src/lib/prisma.ts` — singleton Prisma

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Validação retorna resultado correto
    Tool: Playwright
    Steps:
      1. Navegar para /disparoswpp/contatos/<listId>
      2. Clicar "Validar Números"
      3. Aguardar resposta (até 10s)
    Expected Result: Modal/toast mostra "X válidos, Y inválidos". Nenhum erro 500.
    Evidence: .omo/evidence/task-6-validate-numbers.png
  ```

  **Commit**: YES — `feat(contacts): add validate numbers button to contact list page`

- [x] 7. finalize-campaign-worker.ts — novo handler

  **What to do**:
  - Criar `workers/src/workers/finalize-campaign-worker.ts`
  - Função `processFinalCampaign(job: Job<{ campaignId: string }>)`:
    - Busca contagem de Messages com `status = PENDING` para o campaignId
    - Se count === 0: `prisma.campaign.update({ where: { id: campaignId }, data: { status: CampaignStatus.COMPLETED } })`
    - Se count > 0: re-enfileira `finalize-campaign` job com delay 60000ms e os mesmos dados
    - Se campaign.status não é RUNNING (foi pausada/cancelada): retornar sem fazer nada

  **Must NOT do**:
  - Não setar COMPLETED se ainda há PENDING messages
  - Não modificar `src/lib/campaign-worker.ts` (legado)
  - Não adicionar loops infinitos síncronos — usar re-enqueue com delay

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2A — com Tasks 4, 6, 9, 12)
  - **Blocks**: Tasks 8, 10, 14
  - **Blocked By**: Task 1

  **References**:
  - `workers/src/workers/message-worker.ts` — padrão de Job handler, prisma, imports
  - `workers/src/workers/campaign-worker.ts` — como processCampaignDispatch funciona
  - `workers/src/index.ts` — como workers são registrados (concurrency, switch)
  - `workers/src/lib/prisma.ts` — prisma singleton do worker
  - `@prisma/client` — CampaignStatus enum (RUNNING, COMPLETED, PAUSED etc.)

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: processFinalCampaign seta COMPLETED quando não há PENDING (unit — sem depender de Tasks 8+14)
    Tool: Bash (npx tsx script inline)
    Preconditions: Campaign exists in DB with status=RUNNING and 0 PENDING Messages
    Steps:
      1. Criar campanha de teste no DB: INSERT INTO "Campaign"(id,status,...) com status='RUNNING'
      2. Garantir 0 Message rows PENDING para esse campaignId
      3. npx tsx -e "import { processFinalCampaign } from './workers/src/workers/finalize-campaign-worker'; processFinalCampaign({ data: { campaignId: '<id>' } } as any).then(() => console.log('done'))"
      4. docker exec disparoswpp-postgres-1 psql -U disparos -d disparoswpp -c "SELECT status FROM \"Campaign\" WHERE id='<id>';"
    Expected Result: status = COMPLETED
    Evidence: .omo/evidence/task-7-completed-unit.txt

  Scenario: processFinalCampaign não seta COMPLETED se campaign.status = PAUSED
    Tool: Bash (npx tsx script inline)
    Preconditions: Campaign exists with status=PAUSED
    Steps:
      1. Inserir campanha com status='PAUSED' e 0 PENDING Messages
      2. Invocar processFinalCampaign diretamente (mesmo comando acima)
      3. SELECT status FROM "Campaign" WHERE id='<id>'
    Expected Result: status = PAUSED (não COMPLETED — handler retornou sem alterar)
    Evidence: .omo/evidence/task-7-no-complete-paused.txt

  NOTE: Cenário de end-to-end (campanha realmente chega a COMPLETED via fila) é coberto por F3 após Tasks 8 e 14 estarem prontas.
  ```

  **Commit**: YES — `feat(campaigns): finalize-campaign worker sets COMPLETED`

- [x] 8. campaign-worker.ts — enfileirar finalize-campaign após dispatch

  **What to do**:
  - Em `workers/src/workers/campaign-worker.ts`, ao final de `processCampaignDispatch`, após enfileirar todos os `send-message` jobs:
    - Calcular delay: `const finalizeDelay = contacts.length * (campaign.throttleDelay ?? 3000) + 30000`
    - Enfileirar job: `await messageSendQueue.add("finalize-campaign", { campaignId: campaign.id }, { delay: finalizeDelay })`
  - Aplicar mesmo padrão ao `processScheduledCampaign` em `workers/src/workers/scheduled-campaign-worker.ts` (se ele chama dispatch ou set RUNNING diretamente)

  **Must NOT do**:
  - Não criar um novo queue — usar o `messageSendQueue` existente
  - Não modificar `src/lib/campaign-worker.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2B — após Task 7)
  - **Blocks**: nenhum diretamente (Task 14 registra o handler)
  - **Blocked By**: Task 7

  **References**:
  - `workers/src/workers/campaign-worker.ts` — `processCampaignDispatch`, como jobs send-message são adicionados
  - `workers/src/workers/scheduled-campaign-worker.ts` — verificar se também precisa de finalize
  - `workers/src/lib/queues.ts` — queue disponível no worker process

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: finalize-campaign job aparece na fila após dispatch
    Tool: Bash (redis-cli)
    Steps:
      1. Iniciar campanha
      2. redis-cli ZRANGE bull:message-send:delayed 0 -1 WITHSCORES | grep finalize
    Expected Result: Job finalize-campaign presente na fila delayed com score correto.
    Evidence: .omo/evidence/task-8-finalize-queued.txt
  ```

  **Commit**: YES (junto com Task 7)

- [x] 9. pauseCampaign — remover jobs da fila

  **What to do**:
  - Em `src/actions/campaigns.ts`, na função `pauseCampaign`:
    - Após `prisma.campaign.update({ status: PAUSED })`, adicionar lógica de remoção de jobs (copiar de `cancelCampaign`)
    - Buscar jobs em `messageSendQueue` nos estados `waiting` e `delayed`
    - Remover todos cujo `job.data.campaignId === campaignId` (tanto `send-message` quanto `finalize-campaign` para este campaign)
    - Usar `await job.remove()` para cada job encontrado

  **Must NOT do**:
  - Não remover jobs de outras campanhas
  - Não mudar o status para PAUSED se já está PAUSED (verificar antes)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2A — com Tasks 4, 6, 7, 12)
  - **Blocks**: Task 10
  - **Blocked By**: Task 1

  **References**:
  - `src/actions/campaigns.ts` — função `cancelCampaign` (tem a lógica de remoção de jobs — copiar e adaptar)
  - `src/lib/queues.ts` — `messageSendQueue` no contexto Next.js
  - `src/actions/campaigns.ts` — função `pauseCampaign` atual (só faz prisma.update)

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Pause remove jobs da fila
    Tool: Bash (redis-cli + psql)
    Steps:
      1. Iniciar campanha com 10 contatos, throttleDelay=5000
      2. Aguardar 2s (alguns jobs ainda na fila)
      3. Clicar Pausar na UI
      4. redis-cli LLEN "bull:message-send:wait" (deve ser 0 ou sem jobs desta campanha)
      5. redis-cli ZRANGE bull:message-send:delayed 0 -1 | grep <campaignId>
    Expected Result: Nenhum job com campaignId na fila após pause.
    Evidence: .omo/evidence/task-9-pause-removes-jobs.txt
  ```

  **Commit**: YES — `fix(campaigns): pauseCampaign removes queued jobs`

- [x] 10. resumeCampaign — nova Server Action

  **What to do**:
  - Em `src/actions/campaigns.ts`, criar `resumeCampaign(campaignId: string)`:
    1. `getCurrentUser()` + ownership check
    2. Verificar que campaign.status === PAUSED
    3. `prisma.campaign.update({ status: RUNNING })`
    4. Buscar Message rows onde `campaignId` e `status = PENDING`:
       ```ts
       const pendingMessages = await prisma.message.findMany({
         where: { campaignId, status: MessageStatus.PENDING },
         include: { campaign: { include: { waInstance: true } }, contact: true }
       })
       ```
    5. Para cada pendingMessage (com stagger delay), enfileirar `send-message` job com o payload correto (igual ao que `campaign-worker` enfileira)
    6. Enfileirar novo `finalize-campaign` job com delay = `pendingMessages.length * throttleDelay + 30000`
    7. `revalidatePath("/campanhas")`
  - NUNCA chamar `startCampaign` internamente

  **Must NOT do**:
  - Nunca criar novas Message rows — apenas re-enfileirar as PENDING existentes
  - Nunca chamar startCampaign (cria duplicatas)
  - Não retornar Prisma errors raw

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial após Tasks 7 e 9)
  - **Blocked By**: Tasks 7, 9

  **References**:
  - `src/actions/campaigns.ts` — padrão Server Actions (getCurrentUser, ownership, revalidatePath)
  - `workers/src/workers/campaign-worker.ts` — payload exato do `send-message` job (para replicar na Server Action)
  - `src/lib/queues.ts` — `messageSendQueue` no contexto Next.js
  - `prisma/schema.prisma` — Message model (campos: id, contactPhone, contactName, contactCustomFields, instanceName, messageTemplate, mediaUrl, mediaType)

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Resume sem criar Message duplicadas
    Tool: Bash (psql)
    Steps:
      1. Iniciar campanha com 3 contatos
      2. Pausar após 1s
      3. Chamar resumeCampaign
      4. SELECT COUNT(*) FROM "Message" WHERE "campaignId"='<id>'
    Expected Result: COUNT = 3 (não 6 ou mais). Todos mensagens chegam ao destinatário.
    Evidence: .omo/evidence/task-10-resume-no-duplicates.txt
  ```

  **Commit**: YES — `feat(campaigns): resumeCampaign re-enqueues from PENDING messages`

- [x] 11. campaign-actions.tsx — botão Retomar

  **What to do**:
  - Em `src/components/campaigns/campaign-actions.tsx`:
    - Adicionar botão "Retomar" visível quando `campaign.status === "PAUSED"`
    - Chamar `resumeCampaign(campaign.id)` ao clicar
    - Manter visual dark/futurista: bordas neon green, mesmo estilo dos botões existentes

  **Must NOT do**:
  - Não editar src/components/ui/
  - Não adicionar botão Retomar para status diferentes de PAUSED

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 10

  **References**:
  - `src/components/campaigns/campaign-actions.tsx` — botões existentes (Iniciar, Pausar, Cancelar)
  - `src/actions/campaigns.ts` — resumeCampaign (Task 10)

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Botão Retomar aparece para campanha PAUSED
    Tool: Playwright
    Steps:
      1. Pausar uma campanha
      2. Navegar para /disparoswpp/campanhas
      3. Verificar que botão "Retomar" está visível na linha da campanha PAUSED
      4. Clicar Retomar
    Expected Result: Status muda para RUNNING. Mensagens continuam sendo enviadas.
    Evidence: .omo/evidence/task-11-retomar-button.png
  ```

  **Commit**: YES (junto com Task 10)

- [x] 12. sendReply Server Action

  **What to do**:
  - Em `src/actions/inbox.ts`, adicionar `sendReply(inboxMessageId: string, text: string)`:
    1. `getCurrentUser()` + buscar InboxMessage por id com ownership check (via `waInstance.userId`)
    2. Buscar `waInstance` pelo `inboxMessage.waInstanceId`
    3. Validar que `text.trim().length > 0`
    4. Enfileirar job `send-reply` na `messageSendQueue`:
       ```ts
       await messageSendQueue.add("send-reply", {
         instanceName: waInstance.name,
         toPhone: inboxMessage.fromPhone,
         text: text.trim()
       })
       ```
    5. Retornar `{ success: true }`
  - NUNCA chamar evolutionClient diretamente

  **Must NOT do**:
  - Não criar Message row (sem campanha associada)
  - Não expor API key na resposta
  - Não chamar evolutionClient da Server Action

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2A — independente, sem bloqueios de Wave 2A/2B)
  - **Blocks**: Tasks 13, 15
  - **Blocked By**: None (pode iniciar junto com Wave 2A)

  **References**:
  - `src/actions/inbox.ts` — padrão de Server Actions (getCurrentUser, markAsRead)
  - `src/lib/queues.ts` — messageSendQueue
  - `prisma/schema.prisma` — InboxMessage model (waInstanceId, fromPhone)

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: sendReply enfileira job corretamente
    Tool: Bash (redis-cli)
    Steps:
      1. Chamar sendReply(<inboxMessageId>, "Olá, como posso ajudar?")
      2. redis-cli LRANGE bull:message-send:wait 0 -1 | grep send-reply
    Expected Result: Job send-reply presente na fila com toPhone e text corretos.
    Evidence: .omo/evidence/task-12-send-reply-queued.txt
  ```

  **Commit**: YES — `feat(inbox): sendReply Server Action via BullMQ`

- [x] 13. reply-worker.ts — handler send-reply

  **What to do**:
  - Criar `workers/src/workers/reply-worker.ts`
  - Função `processSendReply(job: Job<{ instanceName: string, toPhone: string, text: string }>)`:
    - Normalizar phone (digits < 12 → adicionar `55` prefix, igual ao message-worker)
    - Chamar `evolutionClient.sendText(instanceName, normalizedPhone, text)`
    - Em caso de erro: logar (não rethrow — mesma política anti-ban do message-worker)

  **Must NOT do**:
  - Não criar Message row no DB (reply não tem campanha)
  - Não rethrow erros (política anti-ban, mesma do message-worker)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2B — após Task 12)
  - **Blocked By**: Task 12

  **References**:
  - `workers/src/workers/message-worker.ts` — padrão completo (normalizePhone, evolutionClient, erro handling)
  - `workers/src/lib/evolution.ts` — evolutionClient no contexto worker
  - `workers/src/index.ts` — como handlers são registrados

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Reply chega ao destinatário
    Tool: Bash (docker logs)
    Steps:
      1. Disparar sendReply para número real
      2. docker logs disparoswpp-worker-1 2>&1 | grep send-reply
    Expected Result: Log mostra job completed. Mensagem recebida no WhatsApp de destino.
    Evidence: .omo/evidence/task-13-reply-delivered.txt
  ```

  **Commit**: YES (junto com Task 12)

- [x] 14. workers/index.ts — registrar finalize-campaign e send-reply handlers

  **What to do**:
  - Em `workers/src/index.ts`, no switch/map de job types do worker `message-send`:
    - Adicionar case `"finalize-campaign"`: chamar `processFinalCampaign(job)`
    - Adicionar case `"send-reply"`: chamar `processSendReply(job)`
  - Importar os novos workers: `import { processFinalCampaign } from "./workers/finalize-campaign-worker"` e `import { processSendReply } from "./workers/reply-worker"`

  **Must NOT do**:
  - Não alterar concurrency do worker (manter 5)
  - Não criar queues separadas para estes job types

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial após Tasks 7 e 13)
  - **Blocked By**: Tasks 7, 13

  **References**:
  - `workers/src/index.ts` — estrutura atual do switch de job types
  - `workers/src/workers/finalize-campaign-worker.ts` (Task 7)
  - `workers/src/workers/reply-worker.ts` (Task 13)

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Worker inicia sem erros com novos handlers
    Tool: Bash (docker logs)
    Steps:
      1. docker compose up -d worker
      2. docker logs disparoswpp-worker-1 2>&1 | head -5
    Expected Result: "Worker started: listening on message-send + campaign-scheduler". Sem erros de import.
    Evidence: .omo/evidence/task-14-worker-starts.txt
  ```

  **Commit**: YES (junto com Tasks 7 e 13)

- [x] 15. MessageItem — inline reply form

  **What to do**:
  - Em `src/components/inbox/message-item.tsx`:
    - Adicionar estado local `showReply: boolean` e `replyText: string` e `isSending: boolean`
    - Botão "Responder" que toggle `showReply`
    - Quando `showReply=true`: mostrar `<textarea>` + botão "Enviar" + botão "Cancelar"
    - Ao enviar: chamar `sendReply(message.id, replyText)`, desabilitar inputs durante envio, limpar `replyText` e fechar form em sucesso, mostrar toast de erro em falha
    - Estilo dark/futurista: bordas `border-[rgba(37,211,102,0.3)]`, texto neon green nos botões

  **Must NOT do**:
  - Não construir view de conversa/thread
  - Não armazenar histórico de replies na UI além do estado local
  - Não editar src/components/ui/

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 12

  **References**:
  - `src/components/inbox/message-item.tsx` — implementação atual (markAsRead, estilo)
  - `src/actions/inbox.ts` — sendReply (Task 12)
  - `src/app/(dashboard)/inbox/[instanceId]/page.tsx` — contexto de uso do MessageItem
  - UI theme: `#0a0f0d` bg, `#25D366` neon green, bordas `rgba(37,211,102,0.3)`

  **Acceptance Criteria**:

  QA Scenarios:
  ```
  Scenario: Reply enviado com sucesso via UI
    Tool: Playwright
    Steps:
      1. Navegar para /disparoswpp/inbox/<instanceId>
      2. Clicar "Responder" em uma mensagem
      3. Digitar "Olá, tudo bem?" no textarea
      4. Clicar "Enviar"
      5. Verificar que textarea limpa e form fecha
    Expected Result: Toast de sucesso. Job send-reply na fila (verificar redis-cli).
    Evidence: .omo/evidence/task-15-reply-ui.png

  Scenario: Erro de envio mostra feedback
    Tool: Playwright
    Steps:
      1. Desconectar instância WA
      2. Tentar enviar reply
    Expected Result: Toast de erro em < 10s. UI não fica travada.
    Evidence: .omo/evidence/task-15-reply-error.png
  ```

  **Commit**: YES — `feat(inbox): inline reply form in MessageItem`

---

## Final Verification Wave

> 4 agentes em PARALELO. TODOS devem APROVAR. Apresentar resultados consolidados e aguardar OK explícito do usuário antes de concluir.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Ler o plano completo. Para cada "Must Have": verificar se implementação existe (ler arquivo, curl endpoint, rodar comando). Para cada "Must NOT Have": buscar padrões proibidos — rejeitar com file:line se encontrado. Verificar arquivos de evidência em .omo/evidence/.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Rodar `npx tsc --noEmit` + `npm run lint`. Revisar todos os arquivos alterados: `as any`/`@ts-ignore`, catches vazios, console.log em prod, código comentado, imports não usados. AI slop: comentários excessivos, abstrações prematuras, nomes genéricos (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill para UI)
  Executar TODOS os QA Scenarios de TODAS as tasks. Testar integração entre features. Salvar evidências em `.omo/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  Para cada task: ler "What to do", ler diff real (git log/diff). Verificar 1:1 — tudo especificado foi construído, nada além do especificado foi construído. Checar "Must NOT do" compliance.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy
- Wave 1A/1B: `feat(contacts): add dedup migration and unique constraint`
- Wave 2A/2B (import): `feat(contacts): wire ColumnMapper, add validateNumbers button`
- Wave 2A/2B/2C (campaigns): `feat(campaigns): finalize-campaign job, pause removes jobs, resumeCampaign`
- Wave 2A/2B/2C (inbox): `feat(inbox): sendReply Server Action + worker + inline UI`

## Success Criteria

### Verification Commands
```bash
# Unique constraint exists
npx prisma db pull && grep "@@unique" prisma/schema.prisma

# Campaign COMPLETED after send
docker exec disparoswpp-postgres-1 psql -U disparos -d disparoswpp -c "SELECT status FROM \"Campaign\" WHERE id='<id>';"

# No duplicate messages after pause+resume  
docker exec disparoswpp-postgres-1 psql -U disparos -d disparoswpp -c "SELECT COUNT(*) FROM \"Message\" WHERE \"campaignId\"='<id>';"

# No queued jobs after pause
docker exec disparoswpp-redis-1 redis-cli LLEN "bull:message-send:wait"

# TypeScript clean
npx tsc --noEmit
npm run lint
```

### Final Checklist
- [ ] ColumnMapper conectado ao CsvUpload, mapping enviado à API
- [ ] Unique constraint no DB sem quebrar dados existentes
- [ ] Botão Validar Números na página da lista
- [ ] Campanhas chegam a COMPLETED automaticamente
- [ ] Pause remove jobs da fila (verificável via redis-cli)
- [ ] Resume não cria Message rows duplicadas
- [ ] Botão Retomar visível para campanhas PAUSED
- [ ] Reply de inbox enfileira job e chega ao destinatário
- [ ] `tsc --noEmit` sem erros
- [ ] `npm run lint` sem warnings
