# src/actions

Server Actions for all mutations. `"use server"` at top of every file.

## PATTERN (mandatory for every action)
1. `const user = await getCurrentUser()` — throws 401 if unauthenticated
2. `schema.safeParse(data)` → return `{ error: "..." }` on failure
3. Ownership filter: always `where: { ..., userId: user.id }`
4. DB write → `revalidatePath(...)` → return `{ success: true }`

## FILES
| File | Domain |
|------|--------|
| `auth.ts` | register, login helpers |
| `campaigns.ts` | createCampaign, startCampaign, pauseCampaign, cancelCampaign, scheduleCampaign, cancelSchedule |
| `contacts.ts` | createContactList, deleteContactList, importContacts |
| `instances.ts` | createInstance, deleteInstance, syncInstanceStatus |
| `inbox.ts` | markAsRead, markAllAsRead |
| `dashboard.ts` | getDashboardStats (read-only server action) |
| `webhook-config.ts` | registerWebhook for Evolution API |

## QUEUE INTEGRATION
- `startCampaign` → enqueues `dispatch-campaign` on `message-send` queue
- `scheduleCampaign` → enqueues `schedule-campaign` on `campaign-scheduler` queue with `delay`
- `cancelCampaign` → removes pending/delayed jobs from queue before status update

## ANTI-PATTERNS
- Never call Evolution API directly from actions except for status checks (best-effort, wrapped in empty catch)
- Never return raw Prisma errors — map to Portuguese user-facing strings
- Never skip ownership check (`userId` filter on every query)
- Never add HTTP mutations here to API routes (`src/app/api/`)
