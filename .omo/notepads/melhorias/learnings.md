# Learnings — melhorias

## [2026-05-28] Session Init

### Stack
- Next.js 16 + React 19 + TypeScript + Prisma 7 + PostgreSQL + Redis + BullMQ + NextAuth v5 + Evolution API v2.3.7 + shadcn/ui
- Dev port: 3001. Postgres: 5433. Redis: 6380. Evolution API: 8081.
- VPS: root@24.144.87.182, app at /var/www/disparoswpp

### Key Patterns
- All mutations: "use server" functions in src/actions/. Pattern: getCurrentUser() -> Zod parse -> ownership check -> DB write -> revalidatePath() -> return { success: true }
- Queue: messageSendQueue in src/lib/queues.ts (lazy-init Proxy). Workers in workers/src/workers/.
- Workers are ISOLATED — never import from src/ into workers/ or vice versa.
- Evolution API retry: 3 attempts, exponential backoff 500ms * 2^attempt on 429/5xx.
- Phone normalization: digits < 12 -> add 55 prefix (in message-worker.ts).
- cancelCampaign in src/actions/campaigns.ts has the queue job removal pattern — copy for pauseCampaign.
- workers/src/index.ts uses a switch on job.name to dispatch to handlers.
- @prisma/adapter-pg used (not default connector) — see src/lib/prisma.ts.

### UI Theme
- Background: #0a0f0d, Primary neon green: #25D366, Borders: rgba(37,211,102,0.3)
- Orbitron font for headings. shadcn/ui primitives — NEVER edit src/components/ui/ manually.

### Anti-patterns
- NEVER call evolutionClient directly from Server Actions for inbox reply — use BullMQ queue.
- NEVER call startCampaign from resumeCampaign — creates duplicate Message rows.
- NEVER set COMPLETED if PENDING messages remain — re-enqueue finalize-campaign with 60s delay.
- NEVER add mutations to API routes (except CSV import which already exists as API route).
- NEVER use auth() in middleware — use getToken().
- NEVER modify src/lib/campaign-worker.ts (legacy).
