# Decisions — melhorias

## [2026-05-28] Session Init

- Media sent as base64 (not public URL) — eliminates nginx/auth dependency
- CSV import stays as API route (not Server Action) — file upload body size implications
- WhatsApp number validation: explicit user button only, NOT automatic at import time
- resumeCampaign must NOT call startCampaign — re-enqueues from existing PENDING Messages
- finalize-campaign re-enqueues itself with 60s delay if PENDING messages remain
- Inbox reply goes via BullMQ queue (never direct evolutionClient call from Server Action)
- @@unique([contactListId, phoneNumber]) migration requires dedup step first (no current unique constraint)
