---
tags: [backend, module]
---

# Module — Media & Notes

Paths: `backend/src/modules/media/`, `backend/src/modules/notes/`.
Mounted at `/api/v1/media` and `/api/v1/notes`.

## media
User uploads (images, PDFs) are written to the server's **local disk** under
`/uploads` and served as public static files by `express.static`.

- Storage: files written via `fs` to `/uploads`; the upload path uses `multer`
  in `app.ts`. No S3 / object storage — `/uploads` is served statically.
- Model: **MediaFile** — `key` (unique disk key), `url` (public `/uploads`
  static URL), `name`, `mimeType`, `sizeBytes`, `type` (**MediaType**:
  IMAGE|PDF). Indexed by `userId`, `(userId,type)`, `(userId, createdAt desc)`.
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
