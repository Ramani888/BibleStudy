---
tags: [backend, module]
---

# Module — Media & Notes

Paths: `backend/src/modules/media/`, `backend/src/modules/notes/`.
Mounted at `/api/v1/media` and `/api/v1/notes`.

## media
User uploads (images, PDFs) to **Hetzner Object Storage** (S3-compatible).

- Client: `config/s3.client.ts` (endpoint/bucket/keys from env:
  `HETZNER_S3_*`). Upload path uses `multer` in `app.ts`.
- Model: **MediaFile** — `key` (unique S3 key), `url`, `name`, `mimeType`,
  `sizeBytes`, `type` (**MediaType**: IMAGE|PDF). Indexed by `userId`,
  `(userId,type)`, `(userId, createdAt desc)`.
- `User.storageLimit` (default 250 MB) caps per-user usage.
- **Replaced the legacy `File` table/`FileType` enum** — dropped in the
  [[Migration History|drop_legacy_file migration]]. All code uses `prisma.mediaFile`.
- Screens: Media, MediaPDFViewer.

## notes
Standalone user notes (independent of cards/sets).

- Model: **Note** — `title`, `body` (Text), `tags String[]`, owned by User.
- The Note model was **redefined** from the init shape
  (`content`/`folderId`/`verseReference`) to the current `body`/`tags` shape —
  see [[Migration History]].
- Client hooks: `useNotes`, `useNoteStats`. Screens: Notes, NoteEditor.

## See also
- [[Database Schema]] · [[Hooks & API Layer]] · [[Migration History]]
