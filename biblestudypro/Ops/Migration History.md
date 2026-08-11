---
tags: [ops, database]
---

# Migration History

Prisma migrations live in `backend/prisma/migrations/`. On **2026-08-04** the
history was reconciled so it applies cleanly from scratch with **zero drift** vs
`schema.prisma`. See [[Database Schema]].

## Timeline

| Migration | What it does |
|-----------|--------------|
| `20260317023612_init` | Initial schema (incl. legacy `Note` and `File` tables) |
| `20260412174102_add_otp_table_and_indexes` | OtpToken + indexes |
| `20260413020546_phase2_community` | Social layer (friends/groups/gatherings/…) |
| `20260428070210_add_color_to_folder_set_add_note_to_card` | colors + `Card.note` + Notification |
| `20260524120000_add_notes` | **Redefines** Note (see below) |
| `20260524130000_add_note_tags` | `Note.tags String[]` |
| `20260525000000_add_media_files` | **MediaFile** table (media system) |
| `20260525000001_add_media_userid_createdat_idx` | media indexes |
| `20260804120000_sync_schema_additive` | reconciliation — additive (see below) |
| `20260804120001_drop_legacy_file` | drops the dead `File` table/`FileType` enum |

## The reconciliation (2026-08-04)

The migration history had drifted from `schema.prisma` (likely from prior
`prisma db push` usage). Three fixes:

1. **`add_notes` was broken** — it re-`CREATE`d the `Note` table already made in
   `init`, so `migrate deploy` from scratch failed with *"relation Note already
   exists"*. Rewrote it to **transform in place**: drop `folderId`/`verseReference`,
   rename `content → body`, keep the existing userId FK/index.
2. **`sync_schema_additive` (new)** — adds everything in `schema.prisma` that had
   no migration: `AIChatSession`, `Bookmark`, `AIChat.sessionId`/`suggestedCards`,
   `Folder.parentId` self-FK (nested folders), `Block` index,
   `ActivityType.CREATED_CARD`, and default fixes (`storageLimit` 250 MB,
   `Note.tags`).
3. **`drop_legacy_file` (new)** — drops the orphaned `File` table + `FileType`
   enum from `init`; media now uses **MediaFile** (see [[Module - Media & Notes]]).

Result: `npx prisma migrate deploy` applies all 10 migrations cleanly;
`prisma migrate diff` reports zero drift.

Committed in `32a5ded` (`fix(db): reconcile Prisma migration history with schema`).

## Caveat for the remote DB
If a future Hetzner DB was ever managed by `db push`, baseline the two new
migrations with `prisma migrate resolve --applied` rather than re-running them —
see [[Deployment (Hetzner)]].
