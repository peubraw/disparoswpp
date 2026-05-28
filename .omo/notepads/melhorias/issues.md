# Issues — melhorias

## [2026-05-28] Session Init

- Contact model has no unique constraint on (contactListId, phoneNumber) — skipDuplicates: true is a no-op currently
- pauseCampaign only updates DB, does NOT remove jobs from queue
- resumeCampaign does not exist; startCampaign is incorrectly reused (creates duplicate Message rows)
- Workers production path never sets campaign to COMPLETED (only legacy src/lib/campaign-worker.ts does)
- ColumnMapper component exists but is completely disconnected from CsvUpload
- Inbox is read-only — no Server Action or worker supports sending replies
