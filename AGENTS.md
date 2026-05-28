# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-28
**Branch:** main
**Stack:** Next.js 16 + React 19 + TypeScript + Prisma 7 + PostgreSQL + Redis + BullMQ + NextAuth v5 + Evolution API v2.3.7 + shadcn/ui

## OVERVIEW
WhatsApp bulk messaging platform (disparos = "blasts"). Users manage WA instances via Evolution API, build contact lists, run throttled campaigns, and receive inbound messages in an inbox. Two runtimes: Next.js app (port 3001) + standalone Node worker process consuming BullMQ queues.

## STRUCTURE
```
disparoswpp/
├── src/
│   ├── app/                   # Next.js App Router pages + API routes
│   │   ├── (auth)/            # login, register - no sidebar layout
│   │   ├── (dashboard)/       # all protected pages with sidebar
│   │   └── api/               # REST endpoints (webhooks, QR, media upload, stats)
│   ├── actions/               # Next.js Server Actions (ALL mutations go here)
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (22 files - DO NOT edit manually)
│   │   └── {domain}/          # campaigns, contacts, dashboard, inbox, instances, layout, reports
│   ├── lib/                   # Shared singletons: prisma, redis, queues, evolution-client, webhook-processor
│   ├── types/                 # TypeScript types: evolution.ts, campaign.ts (re-exported from index.ts)
│   └── middleware.ts          # JWT auth guard (getToken, NOT auth())
├── workers/                   # Standalone BullMQ worker process (separate package + Dockerfile)
│   └── src/
│       ├── index.ts           # Worker entry: message-send (concurrency 5) + campaign-scheduler (concurrency 2)
│       ├── workers/           # campaign-worker, message-worker, scheduled-campaign-worker
│       └── lib/               # prisma, evolution, interpolate (duplicated from src/lib - intentional isolation)
├── prisma/
│   ├── schema.prisma          # Single migration (0001_init), no DATABASE_URL in schema (set via env)
│   └── seed.ts                # Run via npm run db:seed
├── Dockerfile                 # Multi-stage: deps → builder → runner + migrate target
├── workers/Dockerfile         # Separate image for worker
└── docker-compose.yml         # 6 services: postgres, redis, migrate, app, worker, evolution-api
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add/change mutation | `src/actions/` | Server Actions only, never in API routes |
| Add page | `src/app/(dashboard)/` | Use existing layout.tsx |
| Add API endpoint | `src/app/api/` | Webhooks, file uploads, external callbacks only |
| WhatsApp API calls | `src/lib/evolution-client.ts` | Singleton `evolutionClient`, retry on 429/5xx |
| Queue a job | `src/lib/queues.ts` | Lazy-init Proxy pattern, two queues |
| Process webhook | `src/lib/webhook-processor.ts` | MESSAGES_UPDATE, CONNECTION_UPDATE, MESSAGES_UPSERT |
| Campaign dispatch logic | `workers/src/workers/campaign-worker.ts` | Chunks of 100, throttleDelay per message |
| Message sending | `workers/src/workers/message-worker.ts` | Interpolates template vars |
| Scheduled campaign trigger | `workers/src/workers/scheduled-campaign-worker.ts` | Calls startCampaign equivalent |
| DB schema | `prisma/schema.prisma` | 8 models: User, WaInstance, ContactList, Contact, Campaign, CampaignContactList, Message, InboxMessage |
| Auth config | `src/auth.ts` | NextAuth v5, JWT strategy, credentials only |
| Auth guard | `src/middleware.ts` | Uses `getToken` (NOT `auth()`), cookie name differs prod/dev |
| UI primitives | `src/components/ui/` | shadcn/ui - regenerate via `npx shadcn add`, don't hand-edit |
| Env vars | `.env.example` | Required: DATABASE_URL, REDIS_URL, AUTH_SECRET, EVOLUTION_API_URL, EVOLUTION_API_KEY |

## KEY PATTERNS

### Server Actions
All mutations are `"use server"` functions in `src/actions/`. Pattern:
1. `getCurrentUser()` → throws if unauthenticated
2. Zod parse input → return `{ error: "..." }` on failure
3. Ownership check (always filter by `userId`)
4. DB write → `revalidatePath()` → return `{ success: true }`

### Queue Architecture
- **`message-send`** queue: two job types on same queue
  - `dispatch-campaign` → `processCampaignDispatch` (fans out send-message jobs with staggered delays)
  - `send-message` → `processSendMessage` (calls Evolution API)
- **`campaign-scheduler`** queue: `schedule-campaign` → triggers campaign dispatch at scheduled time
- Next.js app **only enqueues** (via `src/lib/queues.ts`). Workers **only consume** (separate process).
- Queue singletons in Next.js use lazy-init Proxy to avoid premature Redis connections at import time.

### Prisma
- No `DATABASE_URL` in `schema.prisma` — must be set via env
- `postinstall` uses a dummy URL for `prisma generate` (CI-safe)
- `@prisma/adapter-pg` used (not default connector) — see `src/lib/prisma.ts`

### Evolution API
- External WhatsApp gateway: `evoapicloud/evolution-api:v2.3.7` (v2.2.3 had Baileys stream:error 515)
- Retry: 3 attempts, exponential backoff (500ms * 2^attempt) on 429 or 5xx
- Webhook events registered per instance: `MESSAGES_UPDATE`, `CONNECTION_UPDATE`, `MESSAGES_UPSERT`
- Instance names are unique strings (not UUIDs)

### Auth / Middleware
- NextAuth v5 beta (`next-auth@5.0.0-beta.30`) — API differs from v4
- Middleware uses raw `getToken()` (NOT `auth()` wrapper) to avoid edge runtime issues
- Cookie name: `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod)
- `trustHost: true` required for Docker deployments
- `session.user.id` extended via `src/types/next-auth.d.ts`

## TWO WORKER ARCHITECTURES
Two parallel campaign dispatch implementations exist:

| | `src/lib/campaign-worker.ts` | `workers/` service |
|---|---|---|
| Runtime | In-process (Next.js) | Standalone Docker container |
| Concurrency | 1 | 5 |
| Throttle | `setTimeout` sleep loop | Staggered job `delay` |
| Phone normalization | Yes (`normalizePhone`, adds `55` prefix) | Yes (digits < 12 → `55${digits}`, in message-worker) |
| Production path | No | **Yes** (docker-compose) |

`src/lib/campaign-worker.ts` is legacy/dev fallback. `workers/` is canonical for production.

## ANTI-PATTERNS
- **Never edit `src/components/ui/`** — shadcn/ui generated files, re-run `npx shadcn add` to update
- **Never add mutations to API routes** — use Server Actions in `src/actions/`
- **Never import workers/ code into src/** — worker is an isolated process with its own deps
- **Never use `auth()` in middleware** — use `getToken()` (edge runtime compatibility)
- **Never set `DATABASE_URL` in prisma/schema.prisma** — env-only
- **Empty catch `catch {}` in `startCampaign`** — intentional (Evolution status check is best-effort)
- **Empty catch in webhook route** — intentional (must always return 200 to Evolution API)
- **Do NOT rethrow in `message-worker.ts`** — intentional anti-ban policy; BullMQ will not retry failed sends

## COMMANDS
```bash
# Dev
npm run dev              # Next.js on port 3001
npx tsx workers/src/index.ts  # Worker process (separate terminal)

# DB
npm run db:seed          # Seed initial data
npx prisma migrate dev   # New migration
npx prisma studio        # DB GUI

# Docker (full stack)
docker compose up -d     # postgres + redis + migrate + app + worker + evolution-api
docker compose logs -f worker  # Watch worker logs

# Build
npm run build            # Next.js standalone build
npm run lint             # eslint --max-warnings=0
npx tsc --noEmit         # Type check only (same as CI)
```

## CI
GitHub Actions (`.github/workflows/ci.yml`) — triggers on every push:
- `tsc`: `npm ci` → `npx tsc --noEmit`
- `lint`: `npm ci` → `npm run lint` (eslint --max-warnings=0)
- **No test job. No docker build/publish in CI.**

## NOTES
- Dev port is **3001** (not 3000) — configured in `package.json` and docker-compose
- Postgres exposed on **5433** locally (not 5432) to avoid conflicts
- Redis exposed on **6380** locally (not 6379)
- Evolution API exposed on **8081** locally
- `NEXT_PUBLIC_BASE_PATH` supports sub-path deployment (e.g. behind reverse proxy at `/app`)
- Workers have their own `package.json` + `node_modules` — run `npm install` in `workers/` separately
- `contact.customFields` is a JSON field — interpolated into message templates via `workers/src/lib/interpolate.ts`
- Campaign `throttleDelay` default: 3000ms (3s between messages), range 1000–60000ms
- Message status flow: PENDING → SENT (SERVER_ACK) → DELIVERED (DELIVERY_ACK) → READ / FAILED
- UI theme: dark futuristic — `#0a0f0d` bg, `#25D366` neon green primary, Orbitron font for headings
- `dispatch-campaign` job payload includes `userId` (for ownership check in campaign-worker)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
