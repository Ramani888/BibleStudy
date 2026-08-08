---
title: Notes & Media
tags: [feature, notes, media]
updated: 2026-08-08
---

# Notes & Media

> Personal study notes (title/body/tags CRUD) plus a per-user media library
> (images + PDFs) backed by Hetzner Object Storage, with a race-safe storage
> quota. Media files are also consumed by [[AI Chat]] as attachments.

## Screens
One row per screen in this area. Route = the navigation route name.

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| NotesScreen | `Notes` | ProfileStack | List/search/sort/tag-filter personal notes; FAB to create; long-press to delete |
| NoteEditorScreen | `NoteEditor` | ProfileStack | Create/edit a note (title, body, predefined tags); share as text |
| MediaScreen | `Media` | ProfileStack | Image grid + PDF list, upload (library/camera/PDF), rename/share/delete, multi-select bulk delete, full-screen pinch-zoom image viewer |
| MediaPDFViewerScreen | `MediaPDFViewer` | ProfileStack | Render a PDF by URL (native `react-native-pdf` on iOS, Google Docs WebView on Android) |

Reached from `ProfileScreen` menu items ("My Notes", "My Media") and the
Profile storage bar (taps to `Media`, or `Paywall` when over quota — see G2).

## Features & functionality

### NotesScreen (`Notes`)
- Lists notes newest-first (server orders by `updatedAt desc`).
- **Search** box: case-insensitive substring match on title OR body (client-side).
- **Sort** toggle in header cycles `Recent → A–Z → Oldest` (`SwapIcon` + label).
- **Tag filter bar**: only shown when at least one note has tags. Horizontal pills
  of `NOTE_PREDEFINED_TAGS` (`Theology, Old Testament, New Testament, Prayer,
  History, Devotional, Prophecy`) + an "All" pill. Tapping a pill filters; tapping
  again clears. An effect auto-clears `activeTag` if no note carries it anymore.
- Each note card: title (1 line), relative-date (`just now / Nm / Nh / Nd / locale
  date`), 2-line body preview, tag pills.
- **Tap card** → `NoteEditor` with `{ noteId }`. **Long-press card** → delete confirm dialog.
- **FAB (+)** → `NoteEditor` with `{}` (create mode).
- Pull-to-refresh; `EmptyState` ("No notes yet"); full-screen `ErrorState` with retry on load error.

### NoteEditorScreen (`NoteEditor`)
- Create mode (no `noteId`) vs edit mode (has `noteId`, fetches via `useNote`).
- Title input (`maxLength 500`, autofocus on create), body multiline input.
- One-time hydration guard (`initialized` ref) so re-fetches don't clobber edits.
- **Tag modal** (`TagIcon`): grid of predefined tags, multi-toggle, "Done" button.
  Selected tags also shown as pills above the body.
- **Share** (`ShareIcon`): shares `"{title}\n\n{body}"` as OS text share (disabled until both non-empty).
- **Save** button: disabled until title AND body non-empty; calls create or update; toasts; `goBack()`.
- Edit mode shows spinner while loading, `ErrorState` on load failure.
- Uses `edges={['top','bottom']}` + `keyboardAvoiding` (not a plain tab screen — has its own footer).

### MediaScreen (`Media`)
- **Two tabs**: Images (`IMAGE`) / PDFs (`PDF`) — each is a separate `useMediaFiles(type)` query; tab pills with icons.
- **Sort** icon cycles `newest → oldest → alpha` (client-side; newest = server order, oldest = reversed, alpha = name sort).
- **Images**: 3-column `FlatList` grid, cover thumbnails. Tap → full-screen `Modal` viewer
  with `PinchableImage` (pinch 1–4×, pan when zoomed, double-tap-reset-on-release), share + close buttons, filename caption.
- **PDFs**: list rows (file icon, name, `size · relativeDate`, chevron). Tap → `MediaPDFViewer`.
- **Upload FAB (+)**: for Images opens an `ActionSheet` (Photo Library / Take Photo);
  for PDFs opens the document picker directly. Disabled + full-screen spinner overlay while `uploadMedia.isPending`.
- **Long-press any item** → per-file `ActionSheet`: Rename / Share / Delete.
  - **Rename**: `AppModal` with `TextInput`; edits only the name *stem* — the original
    extension is re-appended on save, and `maxLength` is reduced by the extension length (keeps total ≤255).
  - **Share**: `Share.share({ message: file.url })` (shares the public S3 URL).
  - **Delete**: confirm dialog → `deleteMedia`.
- **Selection mode** (checkbox icon in tab row): tap items to multi-select, header shows
  "N selected" + Cancel + trash. Bulk delete via `useBulkDeleteMedia` (`Promise.allSettled`);
  toast reports `"N deleted"` or `"N deleted, M failed"`.
- Pull-to-refresh; per-tab `EmptyState`; `ErrorState` with retry.

### MediaPDFViewerScreen (`MediaPDFViewer`)
- Params `{ url, name }`.
- **iOS**: lazy-requires `react-native-pdf`, renders with cache; on error shows `ErrorState` "Could not load PDF" + retry.
- **Android**: `WebView` → `https://docs.google.com/gview?embedded=true&url=<encoded>`.
  An injected JS poller (`GOOGLE_DOCS_ERROR_DETECTOR`, 20 checks @1s) watches for
  "unable to generate / no preview available / can't preview" text and posts
  `PDF_LOAD_ERROR`; on failure shows "Preview unavailable" + **Open in browser** (`Linking.openURL`).

## Data flow
```
NotesScreen      → useNotes()           ['notes']        → notesApi.list        → GET    /api/v1/notes
NoteEditor(edit) → useNote(id)          ['notes', id]    → notesApi.getById     → GET    /api/v1/notes/:id
NoteEditor(new)  → useCreateNote()                       → notesApi.create      → POST   /api/v1/notes
NoteEditor(edit) → useUpdateNote(id)                     → notesApi.update      → PUT    /api/v1/notes/:id
NotesScreen      → useDeleteNote()                       → notesApi.delete      → DELETE /api/v1/notes/:id
ProfileScreen    → useNoteStats()  (derives count from ['notes'])

MediaScreen      → useMediaFiles(type)  ['media', type]  → mediaApi.list        → GET    /api/v1/media?type=
MediaScreen      → useUploadMedia()                      → mediaApi.upload      → POST   /api/v1/media/upload (multipart)
MediaScreen      → useRenameMedia()                      → mediaApi.rename      → PATCH  /api/v1/media/:id
MediaScreen      → useDeleteMedia() / useBulkDeleteMedia → mediaApi.delete      → DELETE /api/v1/media/:id
ProfileScreen    → useStorageUsage()    ['storage']      → mediaApi.getStorage  → GET    /api/v1/media/storage
AIChat / picker  → usePickMedia() → useUploadMedia()     → mediaApi.upload      → POST   /api/v1/media/upload
```
- `useUploadMedia` / `useDeleteMedia` / `useBulkDeleteMedia` invalidate **both** `['media']` and `['storage']`.
- `useRenameMedia` invalidates only `['media']` (size unchanged, so quota untouched).
- `useNoteStats` is a thin derivation over `useNotes` → `{ totalNotes }` (used on Profile).

## Backend

### Notes module — `backend/src/modules/notes/`
- Files: `notes.routes.ts` · `notes.controller.ts` · `notes.service.ts` · `notes.dto.ts`.
- **Endpoints** (all `authMiddleware`, all owner-scoped by `req.user.id`):
  - `POST   /api/v1/notes` — validate `CreateNoteDto`, create note → 201.
  - `GET    /api/v1/notes` — list caller's notes, `orderBy updatedAt desc`.
  - `GET    /api/v1/notes/:id` — fetch one (404 if not owner's).
  - `PUT    /api/v1/notes/:id` — validate `UpdateNoteDto`, partial update.
  - `DELETE /api/v1/notes/:id` — delete (404 if not owner's).
- **Service fns**: `listNotes`, `createNote`, `getNoteById`, `updateNote`, `deleteNote`.
  Every read/update/delete does `findFirst({ id, userId })` first → `NotFoundError` if
  the note isn't the caller's (this is the only ownership guard — there is no admin path).
  `updateNote` spreads only defined fields (`title/body/tags`), so omitted fields are preserved.
  `createNote` defaults `tags` to `[]`.

### Media module — `backend/src/modules/media/`
- Files: `media.routes.ts` · `media.controller.ts` · `media.service.ts` · `media.dto.ts`.
- Uses `multer` memory storage, per-file limit **20 MB** (multer 413/limit before the service runs).
- **Endpoints** (all `authMiddleware`, owner-scoped):
  - `POST   /api/v1/media/upload` — `upload.single('file')`; 400 `NO_FILE` if missing → `uploadFile` → 201.
  - `GET    /api/v1/media?type=IMAGE|PDF` — `listFiles` (type optional).
  - `GET    /api/v1/media/storage` — `getStorageUsage`.
  - `PATCH  /api/v1/media/:id` — `renameFile` (body `{ name }`).
  - `DELETE /api/v1/media/:id` — `deleteFile`.
- **Service fns**:
  - `uploadFile(userId, file)` — the heart of the feature; validates type, transforms, enforces quota, uploads to S3, persists. Detailed in Edge cases.
  - `listFiles(userId, dto)` — `findMany({ userId, ...type })` ordered `createdAt desc`.
  - `deleteFile(userId, fileId)` — owner check → DB txn (delete row + decrement `storageUsed`) → then S3 delete (best-effort).
  - `renameFile(userId, fileId, name)` — owner check → update `name`; maps Prisma `P2025` → `NotFoundError`.
  - `getStorageUsage(userId)` — returns `{ used, limit, percent }` (percent clamped 0–100; 0 if limit is 0).
- **s3.client** (`backend/src/config/s3.client.ts`): AWS SDK v3 `S3Client` pointed at
  `HETZNER_S3_ENDPOINT`, `forcePathStyle: false`. `S3_BASE_URL` is derived as
  `https://<bucket>.<location>.your-objectstorage.com` (location parsed from endpoint host);
  **process exits at boot** if the endpoint is misconfigured (`your-objectstorage` placeholder). Objects are `public-read`, so `MediaFile.url` is directly loadable in `<Image>` / PDF viewers with no signing.

### DTOs (zod)
- `CreateNoteDto`: `title` 1–500 required, `body` ≥1 required, `tags` string[] optional.
- `UpdateNoteDto`: same fields, all `.optional()` (partial update).
- `ListMediaDto`: `type` enum `IMAGE|PDF` optional (parsed from query).
- `RenameMediaDto`: `name` trimmed, 1–255.
- (Upload has no zod DTO — file type/size validated in `multer` + service.)

## Data model
```prisma
model Note {
  id        String   @id @default(uuid())
  title     String
  body      String   @db.Text
  tags      String[]
  userId    String
  user      User     @relation(..., onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId])
}

model MediaFile {
  id        String    @id @default(uuid())
  userId    String
  key       String    @unique      // S3 object key
  url       String                 // public https URL
  name      String                 // display name (with real ext)
  mimeType  String
  sizeBytes Int
  type      MediaType              // IMAGE | PDF
  createdAt DateTime  @default(now())
  user      User      @relation(..., onDelete: Cascade)
  @@index([userId]) @@index([userId, type]) @@index([userId, createdAt desc])
}

enum MediaType { IMAGE  PDF }

// On User:
storageUsed   BigInt @default(0)          // bytes currently used
storageLimit  BigInt @default(262144000)  // 250 MB free tier
notes         Note[]
mediaFiles    MediaFile[]
```
- Both models cascade-delete with the `User`. Deleting a user drops rows but **not** the
  S3 objects (no cascade to storage — orphaned objects remain in the bucket).
- `storageUsed`/`storageLimit` are `BigInt` — service converts with `Number()`/`BigInt()`.

## Edge cases, rules & gotchas

**Storage quota (the critical path).** `uploadFile` enforces quota in two layers:
1. **Fast pre-check** (non-atomic): `findUniqueOrThrow` the user; if
   `storageUsed + finalSize > storageLimit` → throw `413 QUOTA_EXCEEDED` with a
   human message ("You have X remaining") **before** paying for the S3 upload.
2. **Race-safe conditional UPDATE** (the real enforcement) inside a `$transaction`
   *after* the S3 upload:
   ```sql
   UPDATE "User" SET "storageUsed" = "storageUsed" + $size
   WHERE id = $userId AND "storageUsed" + $size <= "storageLimit"
   ```
   If `affected === 0`, two concurrent uploads both passed the pre-check but only one
   fits — the loser re-reads fresh usage, throws `413 QUOTA_EXCEEDED`, and the
   `catch` block **deletes the just-uploaded S3 object** (orphan cleanup). Only on a
   successful increment is the `MediaFile` row created. This closes the double-spend race.
- **Any DB failure after a successful S3 PutObject** → the outer `try/catch` issues a
  best-effort `DeleteObjectCommand` so no orphan is left. S3-delete failures there are swallowed.
- **413 code** flows to the client; `getErrorMessage` surfaces the "X remaining" text as a toast.

**Over-quota after downgrade (#7 / G2).** Nothing is ever auto-deleted when a user drops
below their usage (e.g. subscription downgrade shrinks `storageLimit` — see
[[Credits & Subscriptions]]). The conditional UPDATE simply **blocks all new uploads**
until they delete files or upgrade. Existing files stay viewable.
- **G2 banner**: `ProfileScreen` computes `overQuota = storage.used > storage.limit`.
  When true, the storage bar turns `colors.error`, the label reads
  **"Over storage limit — Upgrade"**, the progress bar clamps at 100%, and tapping it
  navigates to `Paywall` instead of `Media`.

**File type / transform rules (upload):**
- Allowed image mimes: `image/jpeg, image/png, image/webp, image/heic`; plus `application/pdf`.
  Anything else → `400 INVALID_FILE_TYPE`.
- **Images are always re-encoded**: `sharp` resize to fit within 1920×1920 (no enlargement),
  convert to **WebP @ quality 85**. The stored `mimeType` is `image/webp`, ext `webp`, and the
  display `name` gets its extension rewritten to `.webp` (stem preserved). `finalSize` is the
  *compressed* size — quota counts the stored bytes, not the upload bytes. A `sharp` throw →
  `400 INVALID_FILE` ("could be corrupted…").
- **PDFs are stored as-is** but sniff-validated: `%PDF` marker must appear within the first
  1024 bytes → else `400 INVALID_FILE`. `finalSize` = original `file.size`.
- Object key: `users/<userId>/images|pdfs/<uuid>.<ext>`; UUID prevents collisions/enumeration.

**Delete ordering:** `deleteFile` does the **DB transaction first** (row delete +
`storageUsed` decrement), then S3 delete. If S3 delete fails, the object is orphaned in
the bucket but gone from the user's listing and quota — DB is the source of truth, error is
logged not surfaced. (Inverse of upload, where S3 happens first.)

**Rename:** frontend only edits the name stem and re-appends the original extension, so the
stored `mimeType`/`ext` never drift from `name`. Backend maps Prisma `P2025` (row vanished)
→ `NotFoundError`.

**Pickers (frontend, `usePickMedia` + MediaScreen inline handlers):**
- `pickImage` → `launchImageLibrary`; `takePhoto` → `launchCamera`; `pickPdf` →
  `DocumentPicker.pickSingle` (copyTo cachesDirectory, so a stable `fileCopyUri` is uploaded).
- Cancel (`didCancel` / `isCancel`) returns silently. `errorCode === 'permission'` → toast
  telling the user to enable it in Settings. Missing `uri/type/fileName` → "could not read" toast.
- Upload timeout is **60 s** (`mediaApi.upload`) with `onUploadProgress` reporting a % (MediaScreen
  currently just shows an indeterminate spinner; AI chat can pass `onProgress`).

**Media ↔ [[AI Chat]]:** `usePickMedia` exists specifically so AI chat can attach a file —
"Choose from My Media" (lists existing `useMediaFiles()`), Photo Library, Take Photo, or Choose
PDF. Device picks are uploaded through the **same** `useUploadMedia` flow, so **AI attachments
count against the storage quota** exactly like library uploads. The attach menu is gated on
`creditBalance >= MIN_MEDIA_COST` (media analysis is credit-metered — see [[AI Chat]] /
[[Credits & Subscriptions]]).

**Empty / loading / error states:** every list has an `EmptyState`, a spinner while loading,
and `ErrorState` + retry. Notes list uses full-screen `ErrorState`; Media uses inline.

**Known limitations / TODOs:**
- No pagination on notes or media lists — full lists fetched each time.
- No server-side note search/tag filter — all client-side over the full list.
- Orphaned S3 objects (failed cleanup, or user deletion cascade) are never reaped — no GC job.
- Note tags are free-form `String[]` in the DB but the UI only offers the 7 predefined tags.
- Android PDF preview depends on Google Docs viewer (external, requires public URL + network).

## This session's additions (A–G arc)
- **G2 (over-quota UX)**: Profile storage bar turns red, relabels to "Over storage limit —
  Upgrade", and routes to `Paywall` when `used > limit`.
- **#7 (no-destroy-on-downgrade)**: confirmed/annotated that shrinking `storageLimit` never
  deletes files — the conditional UPDATE only *blocks new uploads*; existing media stays.
- **Phase F (AI media attachments)**: `usePickMedia` + "Choose from My Media" wired into
  [[AI Chat]], reusing the media upload path so attachments consume storage quota, and gated
  on credits (`MIN_MEDIA_COST`).

## Related
[[AI Chat]] · [[Credits & Subscriptions]] · [[Profile & Settings]] · [[Architecture Overview]] · [[Database Schema]]
