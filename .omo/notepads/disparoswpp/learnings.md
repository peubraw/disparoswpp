- T11: Workers BullMQ — Prisma 7 in workers uses plain `new PrismaClient()` (no `datasources` option); reads DATABASE_URL from env automatically. Workers queue "message-send" handles both "dispatch-campaign" and "send-message" job names. `import Redis from "ioredis"` works with esModuleInterop:true in CommonJS module mode.
Project scaffold created for disparoswpp: Next.js 16.2.2 app on port 3001, Prisma 7 config via prisma.config.ts, Docker Compose with postgres/redis/app/worker/evolution-api, and CI for tsc + lint.
Used empty placeholder routes/files to keep TypeScript and compose validation green.
Added Evolution API type contracts plus singleton clients for axios, Redis, and Prisma; Prisma-backed Campaign typing needed Prisma.CampaignGetPayload because the generated client does not export a Campaign model type.
3: Prisma 7 validate passes with `schema.prisma` using only `datasource db { provider = "postgresql" }`; URL stays in `prisma.config.ts` and `DATABASE_URL` must be present in the shell for CLI commands.
- shadcn v4 uses @base-ui/react instead of @radix-ui/react for some primitives like Dialog/Sheet.
- 'asChild' prop is not available on SheetTrigger anymore due to the switch to Base UI.
- T5: NextAuth v5 beta.30 middleware: simplest pattern is `export { auth as default } from "@/auth"` — avoids TypeScript issues with the wrapper function approach.
- T5: NextAuth v5 signIn() in server actions throws a redirect internally on success (NEXT_REDIRECT) — catch block must re-throw non-AuthError exceptions.
- T5: Session type augmentation for `session.user.id` requires `src/types/next-auth.d.ts` declaring `interface Session { user: { id: string } & DefaultSession["user"] }`.
- T5: `export { auth as default } from "@/auth"` in middleware.ts with config.matcher handles route protection via NextAuth's built-in session check.
- T7: Contact model has `customFields Json @default("{}")` (not optional) — always pass `{}` not `undefined`. No `@@unique([contactListId, phoneNumber])` in schema so skipDuplicates won't deduplicate by phone but won't error.
- T7: Server component delete buttons need a separate "use client" component (e.g. DeleteListButton) since onClick/confirm can't run in server components.
- T7: Next.js 15 app router dynamic params and searchParams are Promises — must `await params` and `await searchParams` in async server components.
- T7: papaparse default import works: `import Papa from "papaparse"` with `Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })`.
- T6: Prisma schema uses `WaInstanceStatus` enum (not `InstanceStatus`) and `instanceName` field (not `name`) on WaInstance model.
- T6: shadcn v4 Button does not support `asChild` prop — use plain `<Link>` with className for button-styled links instead.
- T6: `form action` in Next.js Server Components requires `(formData: FormData) => void | Promise<void>` — inline server actions must have explicit `: Promise<void>` return type annotation.
- T6: `InboxMessage` model fields: `waInstanceId`, `userId`, `fromPhone`, `body`, `receivedAt`, `isRead` — no `evolutionMessageId` field.
- T6: Route Handler params in Next.js 15+ are `Promise<{ paramName: string }>` — must `await params` before destructuring.
- T10: Prisma schema uses `WaInstanceStatus` (not `InstanceStatus`), `instanceName` (not `name`) on WaInstance, `waInstanceId` (not `instanceId`) on InboxMessage, `fromPhone`/`body` (not `fromNumber`/`text`) on InboxMessage. InboxMessage has no `evolutionMessageId` field. Campaign relation is `waInstance` (not `instance`).
- T10: `processMessagesUpdate` filters by `campaign: { waInstance: { instanceName } }` for tenant safety in Prisma updateMany.
- T10: Pre-existing TS error in `campanhas/[id]/page.tsx` (form action return type mismatch) — not introduced by T10.
- T9: `Campaign` model uses `waInstanceId`, `messageTemplate`, and `contactLists` relation field. `MediaType` enum expects specific values like `NONE`, `IMAGE`, `VIDEO`, etc.
- T9: Server actions returning objects like `{ error: string }` cannot be passed directly to `form action={...}` without wrapping in a `() => { "use server"; ... }` closure or using `useActionState`, otherwise TS2322 complains.
- T9: BullMQ queue options: `connection` receives the `ioredis` instance.

## T12 Findings
- DateTimePicker: no react-day-picker/Calendar in this project — used native `<input type="datetime-local">` with `date-fns` for formatting; `min` attribute set to now+1min for client-side past-date prevention.
- `scheduleCampaign` action: uses campaign ID as BullMQ `jobId` (no schema change needed); `campaignSchedulerQueue.getJob(campaignId)` retrieves it for cancellation.
- `cancelSchedule` action: sets status DRAFT and scheduledFor null; removes BullMQ job by campaign ID.
- `scheduled-campaign-worker.ts`: processes `campaign-scheduler` queue; on fire sets status RUNNING then enqueues `dispatch-campaign` to `message-send` queue (reuses T11 worker).
- Workers `index.ts`: single Redis connection shared across multiple `Worker` instances is fine; each worker closes independently in shutdown.
- REST endpoint params in Next.js 15: `{ params }: { params: Promise<{ id: string }> }` — must `await params`.
- `date-fns/locale` import for `ptBR`: `import { ptBR } from "date-fns/locale"` works without extra config.
- CountdownTimer: `useEffect` with `setInterval(1000)` + cleanup via `clearInterval` is the correct pattern for live countdown in client components.

## T8 Findings
- Added dashboard actions and components (StatsCards, MessagesChart, RecentCampaigns, InstanceStatusList)
- Recharts handles client-side rendering with `use client` directive
- Used Suspense and Skeleton for better UX
- Implemented a read-only inbox for WhatsApp messages with unread badge in sidebar and mark as read functionality.

## T13 Findings
- When doing server component fetching from the DB directly in Next 15, we must still await `params` and `searchParams`.
- To auto-refresh data efficiently without pushing to SWR just for polling, we can use a small Client Component (`AutoRefresh`) that calls `router.refresh()` inside a `setInterval(5000)` only when `campaign.status === 'RUNNING'`.
- A dedicated API route can still be provided for potential webhook or external use-cases even if the page loads data directly via Prisma.
