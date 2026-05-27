# src/app/api

API routes for external callbacks and file operations only. **Not for app mutations** (use `src/actions/`).

## ROUTES
| Route | Method | Purpose |
|-------|--------|---------|
| `webhooks/evolution/route.ts` | POST | Receives Evolution API webhook events → `webhook-processor.ts` |
| `webhooks/evolution/config/route.ts` | POST | Registers webhook URL on an instance |
| `instances/route.ts` | GET | Lists raw Evolution instances (sync helper) |
| `instances/[instanceId]/qr/route.ts` | GET | Returns QR code for WA connection |
| `campaigns/[id]/schedule/route.ts` | POST | Schedules a campaign (external trigger) |
| `campaigns/[id]/stats/route.ts` | GET | Campaign delivery stats for report page |
| `campaigns/media-upload/route.ts` | POST | Multipart media upload, returns URL |
| `contacts/import/route.ts` | POST | CSV import endpoint |
| `auth/[...nextauth]/route.ts` | GET/POST | NextAuth v5 handler |

## WEBHOOK FLOW
```
Evolution API → POST /api/webhooks/evolution
  → parse event type (MESSAGES_UPDATE | CONNECTION_UPDATE | MESSAGES_UPSERT)
  → call matching processor from src/lib/webhook-processor.ts
```

## AUTH IN API ROUTES
- Use `auth()` from `src/auth.ts` (not `getToken`) — edge runtime not a concern here
- Return `401` JSON `{ error: "Unauthorized" }` if no session

## ANTI-PATTERNS
- Never put business mutations here — Server Actions only
- Never bypass `src/lib/webhook-processor.ts` — keep webhook logic centralized
- Never expose Evolution API key in responses
