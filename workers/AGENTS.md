# workers/

Standalone Node.js process. Separate `package.json`, `node_modules`, `Dockerfile`. **Never imported by `src/`.**

## RUNTIME
```bash
npx tsx workers/src/index.ts        # dev
docker compose up worker            # prod
docker compose logs -f worker       # logs
```

## QUEUE WORKERS
| Worker | Queue | Concurrency | Job types |
|--------|-------|-------------|-----------|
| `messageSendWorker` | `message-send` | 5 | `dispatch-campaign`, `send-message` |
| `campaignSchedulerWorker` | `campaign-scheduler` | 2 | `schedule-campaign` |

## JOB FLOW
```
scheduleCampaign (action)
  → campaign-scheduler queue [delayed]
    → processScheduledCampaign
      → enqueues dispatch-campaign

startCampaign (action)
  → message-send queue [dispatch-campaign]
    → processCampaignDispatch
      → creates Message rows in DB
      → fans out send-message jobs (staggered by throttleDelay * index)
        → processSendMessage
          → interpolates template vars
          → calls Evolution API sendText or sendMedia
          → updates Message.status + evolutionMessageId
```

## FILES
| File | Role |
|------|------|
| `src/index.ts` | Entry: creates workers, registers SIGTERM/SIGINT shutdown |
| `src/workers/campaign-worker.ts` | `processCampaignDispatch` — chunk size 100, own Redis+Queue instance |
| `src/workers/message-worker.ts` | `processSendMessage` — template interpolation + Evolution API call |
| `src/workers/scheduled-campaign-worker.ts` | `processScheduledCampaign` — triggers dispatch at scheduled time |
| `src/lib/prisma.ts` | Isolated Prisma client (duplicate of src/lib — intentional) |
| `src/lib/evolution.ts` | Isolated Evolution client (duplicate — intentional) |
| `src/lib/interpolate.ts` | Template variable substitution (`{{name}}`, `{{customField}}`) |

## LOCK / RETRY
- `lockDuration: 5min` on workers to prevent lock expiry during throttled sends
- `maxRetriesPerRequest: null` on Redis connection (BullMQ requirement)

## ANTI-PATTERNS
- Never import from `../../../src/` — isolation is intentional
- Never add HTTP handlers here — pure queue consumers only
- Never skip graceful shutdown — `SIGTERM` handler closes workers then Redis
