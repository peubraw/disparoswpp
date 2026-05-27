# src/components

React components split into `ui/` (shadcn primitives) and domain folders.

## STRUCTURE
```
components/
├── ui/           # shadcn/ui primitives — DO NOT hand-edit (22 files)
├── campaigns/    # countdown-timer, datetime-picker, media-upload, template-editor
├── contacts/     # column-mapper, csv-upload, delete-list-button
├── dashboard/    # instance-status-list, messages-chart, recent-campaigns, stats-cards
├── inbox/        # message-item, unread-badge
├── instances/    # instance-card, qr-code-dialog
├── layout/       # header, sidebar
└── reports/      # auto-refresh, delivery-chart, message-table
```

## ui/ RULES
- **Never edit manually** — regenerate via `npx shadcn add <component>`
- These are plain Radix UI + Tailwind wrappers; treat as library code

## DOMAIN COMPONENTS
- Client components (`"use client"`) for interactive parts (forms, dialogs, charts)
- Server components for data-display-only (page-level fetching done in `src/app/(dashboard)/*/page.tsx`)
- Call Server Actions directly from client components via import — no fetch/API calls for mutations

## CONVENTIONS
- `cn()` from `src/lib/utils.ts` for conditional classes (tailwind-merge + clsx)
- `sonner` toast for action feedback
- `react-hook-form` + `zod` for all forms
- `recharts` for charts (messages-chart, delivery-chart)
- `lucide-react` for icons

## ANTI-PATTERNS
- Never fetch data inside components — lift to page.tsx Server Components
- Never call Evolution API from components — go through Server Actions
- Never add new shadcn primitives by hand — use `npx shadcn add`
