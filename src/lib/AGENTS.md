# src/lib

Shared singletons and utilities. All exported as module-level singletons or named functions.

## FILES
| File | Export | Notes |
|------|--------|-------|
| `prisma.ts` | `prisma` | Uses `@prisma/adapter-pg` (not default connector) |
| `redis.ts` | `redis` | ioredis singleton for BullMQ + general use |
| `queues.ts` | `messageSendQueue`, `campaignSchedulerQueue` | Lazy-init Proxy — safe to import at module level |
| `evolution-client.ts` | `evolutionClient` | `EvolutionClient` class singleton |
| `webhook-processor.ts` | `processMessagesUpdate`, `processConnectionUpdate`, `processMessagesUpsert` | Pure async functions, no HTTP |
| `auth-utils.ts` | `getCurrentUser` | Throws if unauthenticated; used by all server actions |
| `utils.ts` | `cn` | tailwind-merge + clsx helper |
| `campaign-worker.ts` | `startCampaignWorker` | **Legacy in-process BullMQ Worker** — runs inside Next.js; concurrency 1, lockDuration 300s, includes `normalizePhone` + throttle sleep loop. Different architecture from `workers/` service. |

## TWO WORKER ARCHITECTURES (important)
This codebase has **two parallel campaign dispatch implementations**:

| | `src/lib/campaign-worker.ts` | `workers/src/workers/campaign-worker.ts` |
|---|---|---|
| Runtime | In-process (Next.js server) | Standalone Docker container |
| Concurrency | 1 | 5 (message-send worker) |
| Throttle | `setTimeout` sleep per message | Staggered `delay` on enqueued jobs |
| Phone normalization | Yes (`normalizePhone`, adds `55` prefix) | Yes (digits < 12 → `55${digits}`) |
| Logging | `console.log/error` | No-op event handlers |
| Lock duration | 300s | Not set (default) |

The standalone `workers/` service is the production path (used in docker-compose). `src/lib/campaign-worker.ts` appears to be a legacy/fallback used when `workers/` is not running (dev without Docker).

## QUEUE LAZY-INIT PATTERN
Queues use Proxy to defer Redis connection until first use — prevents premature connections during Next.js module evaluation:
```ts
export const messageSendQueue = new Proxy({} as Queue, {
  get(_, prop) { return getMessageSendQueue()[prop as keyof Queue]; }
});
```
**Do not** instantiate `new Queue(...)` directly in Next.js app code — always use the exported proxies.

## EVOLUTION CLIENT
- Retry: 3 attempts, exponential backoff `500ms * 2^attempt` on HTTP 429 or 5xx
- Singleton: `evolutionClient` at module bottom
- Instance names are strings, URL-encoded in all API paths

## WEBHOOK PROCESSOR
- `processMessagesUpdate` — maps Evolution status strings → `MessageStatus` enum
- `processConnectionUpdate` — maps `open/close` → `WaInstanceStatus`
- `processMessagesUpsert` — saves inbound messages; skips `fromMe === true`
- Called from `src/app/api/webhooks/evolution/route.ts`

## ANTI-PATTERNS
- Never create a second Prisma client — use the singleton
- Never connect to Redis directly in Next.js pages/components — use `src/lib/redis.ts`
- Never duplicate these singletons in workers — `workers/src/lib/` has its own copies (intentional isolation)
