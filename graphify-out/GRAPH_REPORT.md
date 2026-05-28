# Graph Report - disparoswpp  (2026-05-28)

## Corpus Check
- 138 files · ~38,139 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 753 nodes · 1227 edges · 64 communities (52 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `544fb36b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 63|Community 63]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 99 edges
2. `getCurrentUser()` - 47 edges
3. `compilerOptions` - 19 edges
4. `Button()` - 19 edges
5. `EvolutionClient` - 19 edges
6. `TODOs` - 17 edges
7. `disparoswpp-7492f7ba` - 13 edges
8. `Card()` - 13 edges
9. `CardHeader()` - 13 edges
10. `CardTitle()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `getInstanceStatus()` --calls--> `getCurrentUser()`  [EXTRACTED]
  src/actions/instances.ts → src/lib/auth-utils.ts
- `NovaCampanhaPage()` --calls--> `getCurrentUser()`  [EXTRACTED]
  src/app/(dashboard)/campanhas/nova/page.tsx → src/lib/auth-utils.ts
- `InstanciasPage()` --calls--> `getCurrentUser()`  [EXTRACTED]
  src/app/(dashboard)/instancias/page.tsx → src/lib/auth-utils.ts
- `AlertAction()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert.tsx → src/lib/utils.ts
- `AvatarImage()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/avatar.tsx → src/lib/utils.ts

## Communities (64 total, 12 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (47): cancelCampaign(), cancelSchedule(), createCampaign(), createCampaignSchema, deleteCampaign(), pauseCampaign(), scheduleCampaign(), startCampaign() (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (40): DashboardStats, getDashboardStats(), CountdownTimer(), CountdownTimerProps, TimeLeft, InstanceStatusList(), InstanceStatusListProps, MessagesChart() (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (48): active_plan, active_work_id, agent, active_plan, agent, elapsed_ms, ended_at, plan_name (+40 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (43): Agent Dispatch Summary, code:block1 (Wave 1 (Fundação — T1 SOZINHO, bloqueia tudo):), code:block10 (Scenario: Criar e iniciar campanha de texto), code:block11 (Scenario: Webhook atualiza status de mensagem), code:block12 (Scenario: Disparo de campanha completo com throttling), code:block13 (Scenario: Agendamento futuro cria job BullMQ), code:block14 (Scenario: Relatório mostra progresso em tempo real), code:block15 (Scenario: Inbox exibe mensagens recebidas) (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (18): CancelScheduleButton(), CancelScheduleButtonProps, DateTimePickerProps, MediaUpload(), MediaUploadProps, TemplateEditor(), TemplateEditorProps, interpolateTemplate() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (20): cn(), CardAction(), Checkbox(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (29): dependencies, axios, @base-ui/react, bcryptjs, bullmq, class-variance-authority, clsx, date-fns (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (15): EvolutionClient, interpolateTemplate(), globalForPrisma, campaignSchedulerWorker, connection, messageSendWorker, connection, messageSendQueue (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (19): dependencies, axios, bullmq, ioredis, pg, @prisma/adapter-pg, @prisma/client, @types/pg (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (18): ANTI-PATTERNS, Auth / Middleware, CI, code:block1 (disparoswpp/), code:bash (# Dev), COMMANDS, Evolution API, graphify (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (13): RetryableResponse, CampaignStatus, CampaignWithStats, ContactRow, MediaType, WaInstanceStatus, EvolutionEventType, EvolutionInstance (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (9): navItems, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (10): createContactList(), COMPANY_KEYS, CsvUpload(), CsvUploadProps, FIELD_LABELS, ImportResult, NAME_KEYS, PHONE_KEYS (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (9): QRCodeDialogProps, QRResponse, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (3): ALLOWED_MIME_TYPES, credentialsSchema, { handlers, signIn, signOut, auth }

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx, @types/bcryptjs, @types/node (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (6): createInstance(), getInstanceStatus(), configureWebhook(), WEBHOOK_EVENTS, POST(), POST()

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (9): ANTI-PATTERNS, code:bash (npx tsx workers/src/index.ts        # dev), code:block2 (scheduleCampaign (action)), FILES, JOB FLOW, LOCK / RETRY, QUEUE WORKERS, RUNTIME (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (8): ANTI-PATTERNS, code:ts (export const messageSendQueue = new Proxy({} as Queue, {), EVOLUTION CLIENT, FILES, QUEUE LAZY-INIT PATTERN, src/lib, TWO WORKER ARCHITECTURES (important), WEBHOOK PROCESSOR

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (7): ANTI-PATTERNS, code:block1 (components/), CONVENTIONS, DOMAIN COMPONENTS, src/components, STRUCTURE, ui/ RULES

### Community 24 - "Community 24"
Cohesion: 0.32
Nodes (3): loginUser(), registerSchema, registerUser()

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (3): metadata, TooltipContent(), TooltipProvider()

### Community 26 - "Community 26"
Cohesion: 0.29
Nodes (6): ANTI-PATTERNS, AUTH IN API ROUTES, code:block1 (Evolution API → POST /api/webhooks/evolution), ROUTES, src/app/api, WEBHOOK FLOW

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (6): autoDetect(), ColumnMapper(), ColumnMapperProps, COMPANY_KEYS, NAME_KEYS, PHONE_KEYS

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (5): deleteInstance(), InstanceCard(), InstanceCardProps, QRCodeDialog(), InstanciasPage()

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (6): state, updatedAt, sessionID, sources, background-task, updatedAt

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): scripts, build, db:seed, dev, lint, postinstall, start

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (6): state, updatedAt, sessionID, sources, background-task, updatedAt

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): state, updatedAt, sessionID, sources, background-task, updatedAt

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (6): state, updatedAt, sessionID, sources, background-task, updatedAt

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (6): state, updatedAt, sessionID, sources, background-task, updatedAt

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (6): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage()

### Community 36 - "Community 36"
Cohesion: 0.48
Nodes (4): mapMessageStatus(), processConnectionUpdate(), processMessagesUpdate(), processMessagesUpsert()

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (5): ANTI-PATTERNS, FILES, PATTERN (mandatory for every action), QUEUE INTEGRATION, src/actions

### Community 38 - "Community 38"
Cohesion: 0.53
Nodes (4): detectCompanyColumn(), detectNameColumn(), detectPhoneColumn(), POST()

### Community 39 - "Community 39"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (3): DispatchCampaignJob, normalizePhone(), processCampaign()

### Community 42 - "Community 42"
Cohesion: 0.40
Nodes (4): ProgressIndicator(), ProgressLabel(), ProgressTrack(), ProgressValue()

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (3): T12 Findings, T13 Findings, T8 Findings

### Community 44 - "Community 44"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **323 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+318 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 5` to `Community 0`, `Community 1`, `Community 35`, `Community 4`, `Community 39`, `Community 42`, `Community 13`, `Community 15`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `getCurrentUser()` connect `Community 0` to `Community 1`, `Community 4`, `Community 14`, `Community 20`, `Community 28`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `EvolutionClient` connect `Community 19` to `Community 0`, `Community 4`, `Community 40`, `Community 12`, `Community 17`, `Community 20`, `Community 28`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _323 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.056692242114237 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08605769230769231 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.050170068027210885 - nodes in this community are weakly interconnected._