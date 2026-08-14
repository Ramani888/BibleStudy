---
title: AI Chat
tags: [feature, ai]
updated: 2026-08-14
---

# AI Chat

> Conversational Bible-study assistant: ask questions, attach a PDF/image, get answers with auto-suggested follow-ups and flashcards you can save to a set — metered by [[Credits & Subscriptions]].

## Screens

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| AIChatScreen | `AIChat` | AINavigator (AITab) | The live conversation — compose, attach media, save cards, bookmark, regenerate, export. |
| ChatHistoryScreen | `ChatHistory` | AINavigator (AITab) | Browse past sessions/bookmarks; search, tag-filter, rename, tag, delete, clear, continue. |

> The Daily Verse endpoint is consumed by [[Home]] (`useDailyVerse`), not by these screens, but it lives in this module.

## Features & functionality

### AIChatScreen (`AIChat`)
- **Empty state**: sparkle icon, headline, and 4 tappable suggestion prompts (`SUGGESTIONS`) that send immediately.
- **Compose & send** (`ChatInput`): multiline TextInput, 1000-char cap (`MAX_LENGTH`), live char counter that turns red at 900 (`WARN_THRESHOLD`); input is always editable — send button disabled only by loading state (not by empty input), preventing stuck states.
- **Optimistic UI**: on send, a user bubble + a `__typing__` placeholder AI bubble are pushed; the placeholder is replaced on success or removed on error.
- **Credit row** (top of ChatInput): shows `N credits remaining`; when `<= 0` shows "No credits — claim your daily credit or **Upgrade**" (the Upgrade link navigates to `ProfileTab → Paywall`). Balance shown is optimistically decremented by 1 while a request is `isPending`.
- **Follow-up chips**: up to 3 chips rendered under each AI message; tapping one re-sends it as a new question. Disabled while pending/loading.
- **Flashcard banner**: when an AI message carries `suggestedCards`, a "N flashcards ready" banner appears with a **Save to Set** button, or a green **Saved** chip once saved.
- **Save to Set / Save as Card** (`CardProposalSheet`): preview cards, pick an existing set OR inline-create one (only offered when the user has zero sets), then bulk-create via `useBulkCreateCards`. Success marks the message saved and persists it (`markCardsSaved`).
- **Attach media** (`+` button → source ActionSheet): "Choose from My Media", "Photo Library", "Take Photo", "Choose PDF". Attached file shows as a removable chip in the composer and as a chip on the sent user bubble.
- **Long-press message** (ActionSheet): Copy, Share; for AI messages also Regenerate, Bookmark/Remove Bookmark (disabled if no `chatId`), Save as Card.
- **Regenerate**: replays the same user question with prior history, swaps the AI bubble back to typing, clears its cards/followUps, and un-saves it. On error the original message is restored.
- **Header actions**: Export (Share sheet with a formatted transcript; hidden via opacity when nothing exportable), Clear chat (confirm dialog → new session), open Chat History (clock icon).
- **Auto-tagging**: after each answer, `detectTags` scans the answer text against `TAG_RULES` and merges any new preset tags into the session, persisting via `updateTags`.
- **`autoSend` route param**: if provided (e.g. deep-link from another screen), the question is sent once on mount (guarded by `lastAutoSendRef`).

### ChatHistoryScreen (`ChatHistory`)
- **View modes**: segmented `all` vs `bookmarked`.
- **Search**: `searchQuery` filters sessions by `customTitle || title` (case-insensitive).
- **Tag filter**: preset tag chips (`Theology, Old Testament, New Testament, Prayer, History, Devotional, Prophecy`); `activeTag` narrows sessions by `s.tags`.
- **Session rows**: expandable to show Q/A message pairs; **Continue conversation** loads the session into the store and navigates back to `AIChat`.
- **Per-session long-press**: Rename (modal, "Conversation name…"), Edit Tags (modal, toggle preset tags, max 5), Delete (confirm). Standalone chats (no sessionId) can't be managed → "Cannot manage this conversation".
- **Clear All History**: confirm dialog, wipes sessions + chats + bookmarks.
- **Empty states**: "No chat history yet", "No bookmarks yet", "No results found / Try a different search term".

## Data flow

```
AIChatScreen → useAIChat (mutation) → aiApi.chat → POST /api/v1/ai/chat → askQuestion → generateAnswer → Prisma ($transaction: user, creditTransaction, aIChat)
             → useMarkCardsSaved → aiApi.markCardsSaved → PATCH /ai/chats/:chatId/cards-saved
             → useAddBookmark/useRemoveBookmark → POST/DELETE /ai/bookmarks
             → useBookmarks(['ai-bookmarks']) → GET /ai/bookmarks
ChatHistoryScreen → useAIChatHistory (infinite, ['ai-history']) → GET /ai/history
             → useRenameSession → PATCH /ai/history/:id/title
             → useUpdateSessionTags → PATCH /ai/history/:id/tags
             → useDeleteSession → DELETE /ai/history/:id
             → useClearHistory → DELETE /ai/history
Home → useDailyVerse → aiApi.getDailyVerse → GET /ai/daily-verse (no auth)
```
Active conversation state lives in **Zustand** (`useAIChatStore`), not React Query — it survives tab navigation. React Query owns history/bookmarks/credits. `useAIChat.onSuccess` invalidates `['ai-history']` and `['credits']`.

## RAG pipeline (semantic context injection)

`backend/src/modules/ai/embeddings.service.ts` — Voyage AI + pgvector.

- **Embedding model**: `voyage-3.5-lite`, 512-dim vectors stored in `Card.embedding` and `Note.embedding` (`Unsupported("vector(512)")` in Prisma schema; raw `$executeRawUnsafe` because Prisma doesn't support vector natively).
- **Index type**: HNSW (`<=>` cosine distance operator) — added by migration `20260810_add_embeddings`.
- **Write path** (fire-and-forget): `cards.service` calls `storeCardEmbedding(cardId, question, answer)` on create/update; `notes.service` calls `storeNoteEmbedding(noteId, title, body)` on create/update. Failures are swallowed (just `console.error`) so they never break the main write.
- **Read path**: `generateAnswer()` calls `retrieveContext(userId, question)` before the Claude/OpenRouter call. It embeds the question as a `query` vector, then runs two parallel `ORDER BY embedding <=> $vec LIMIT 5` queries (cards + notes) scoped to `userId`. The top-K results are prepended to the system prompt as a "personal study library" block.
- **Graceful degradation**: if `VOYAGE_API_KEY` is absent or Voyage returns an error, all functions return empty silently — the AI still answers, just without personal context.
- **Note truncation**: note bodies are truncated to 1000 chars before embedding (voyage-3.5-lite has 32K context, but short chunks retrieve better); only the first 300 chars are injected into the prompt per note.
- **Card format**: `Q: {question}\nA: {answer}` concatenated as a single document for embedding.
- **TOP_K = 5** per collection (5 cards + 5 notes max injected per request).
- **Required env**: `VOYAGE_API_KEY`.

## Backend

- **Module**: `backend/src/modules/ai/` — `ai.routes.ts` · `ai.controller.ts` · `ai.service.ts` (all Prisma) · `ai.dto.ts` (zod) · `embeddings.service.ts` (Voyage AI + pgvector).
- **Endpoints** (all under `/api/v1/ai`, auth required except daily-verse):
  - `GET /daily-verse` — **no auth**, public. Random verse from bible-api.com.
  - `POST /chat` — `aiRateLimit` + `AskQuestionDto`. Ask a question (optional history/session/media).
  - `GET /history` — paginated sessions (page, limit≤100, default 10).
  - `DELETE /history` — clear all history + sessions + bookmarks.
  - `DELETE /history/:sessionId` — delete one session's chats + session row.
  - `PATCH /history/:sessionId/title` — `RenameSessionDto`.
  - `PATCH /history/:sessionId/tags` — `UpdateTagsDto`.
  - `PATCH /chats/:chatId/cards-saved` — mark suggested cards as saved.
  - `GET /bookmarks` — paginated (default limit 20, ≤100).
  - `POST /bookmarks` — `BookmarkDto`, upsert bookmark.
  - `DELETE /bookmarks/:chatId` — remove bookmark.
- **Service functions** (`ai.service.ts`):
  - `generateAnswer(system, messages, media?)` — provider seam (see gotchas). Retries free/OpenRouter transient failures; wraps provider errors as 502 `AI_PROVIDER_ERROR` (no charge).
  - `parseAIResponse(raw)` — splits `|||` follow-ups and `---CARD---` blocks into `{answer, followUps(≤3), suggestedCards(≤10)}`; empty-answer fallback to "Here are your flashcards:".
  - `askQuestion(userId, dto)` — guards balance, resolves media, calls generateAnswer, parses, charges variable cost in a transaction, upserts session, triggers achievement check.
  - `markCardsSaved(userId, chatId)` — `updateMany` (ownership-scoped); 404 if none.
  - `getChatHistory(userId, page, limit)` — two-phase: groupBy sessionId + standalone chats → sorted slots → fetch content only for the page (see gotchas).
  - `deleteSession`, `clearHistory`, `renameSession` (404 if not owned), `updateSessionTags` (upsert).
  - `addBookmark` (404 if chat not owned; upsert), `removeBookmark`, `getBookmarks`.
  - `getDailyVerse()` — fetch with 5s AbortController timeout; falls back to `HARDCODED_VERSE` (John 3:16) on any failure.
- **DTOs** (`ai.dto.ts`):
  - `AskQuestionDto`: `question` 1–2000 chars; `history` ≤20 msgs each ≤4000 chars; `sessionId` uuid?; `mediaIds` uuid[] **max 1**.
  - `RenameSessionDto`: `title` 1–200. `UpdateTagsDto`: `tags` ≤5, each 1–50. `BookmarkDto`: `chatId` uuid.

## Data model

- **AIChat** — `id, userId, sessionId?, question, answer, suggestedCards Json[]=[], followUps String[]=[], cardsSaved=false, creditsUsed=1, createdAt`. `@@index([userId])`, `@@index([sessionId])`. Cascade-deletes with User. One row = one Q&A pair.
- **AIChatSession** — `id (client-supplied, no default), userId, title?, tags String[], createdAt, updatedAt`. Cascade with User. Holds custom title + tags; created lazily via upsert on first chat with a sessionId.
- **Bookmark** — `id, userId, chatId, createdAt`. `@@unique([userId, chatId])`, cascade with both User and AIChat.
- **MediaFile** (from [[Notes & Media]]) — read by askQuestion to build content blocks; `type` is `PDF | IMAGE`.

## Edge cases, rules & gotchas

- **Provider routing seam** (`env.AI_PROVIDER`): text chat routes to `anthropic` (default) or `openrouter`. **Media ALWAYS routes to Claude** (vision/docs) regardless of the setting. Config: `ANTHROPIC_API_KEY`, `AI_PROVIDER`, `AI_MODEL`, `OPENROUTER_API_KEY` (all optional/defaulted in `env.ts`).
- **CLAUDE_MODEL pin**: `env.AI_MODEL` may hold an *OpenRouter* model id when provider=openrouter, so the media-forced Claude path pins `CLAUDE_MODEL` (`claude-haiku-4-5-20251001`) rather than trusting `AI_MODEL`. Text-Claude path uses `AI_MODEL || CLAUDE_MODEL`.
- **Free-tier retry**: OpenRouter free models cold-start and share a rate-limited pool. `generateAnswer` retries up to `MAX_ATTEMPTS=3` on 429/5xx with linear backoff (1s, 2s); non-retryable or exhausted → 502 `AI_PROVIDER_ERROR` with "No credit was charged".
- **Empty-answer fallbacks (two layers)**: (1) if `generateAnswer` returns empty text, `askQuestion` throws 502 `AI_EMPTY_RESPONSE` **before charging**; (2) if a model emits only cards with no intro, `parseAIResponse` substitutes "Here are your flashcards:" so the bubble is never blank.
- **Variable credit cost** (`CREDIT_COST = {text:1, cards:2, image:3, pdf:5}`): media dominates — a PDF/image chat is charged the media rate even if it also returns cards. Priority: pdf > image > cards > text.
- **Full-cost-upfront for media (G1)**: because media routes to *paid* Claude, `askQuestion` requires the **full** media cost upfront (no floor) and throws **402 `PAYMENT_REQUIRED`** before the Claude call if balance < cost — so no paid request is made that can't be charged. Message nudges toward earning/upgrade.
- **Atomic credit reserve** (b497ca5): the old stale-read + decrement pattern (TOCTOU race) was replaced with a single atomic `UPDATE "User" SET "creditBalance" = "creditBalance" - $cost WHERE id = $id AND "creditBalance" >= $cost RETURNING id`. If no row is returned, the reserve failed (insufficient balance). Media is reserved full-cost-upfront; text reserves 1 and charges an extra 1 if cards are generated. Provider errors and empty responses refund the reserve atomically.
- **Charge floor for text/cards**: after the AI has already run, actual charge can't exceed balance. The atomic path handles this in the WHERE clause.
- **Balance gate**: `askQuestion` throws 402 if `creditBalance < 1` up front. Frontend also blocks send at `creditBalance <= 0` with a toast pointing to the daily credit.
- **Session survival (Zustand)**: the visible conversation is `useAIChatStore.messages`; it persists across tab switches. `clear()` and `loadSession()` mint a **new client-side UUID** sessionId. Loading a history session expands each AIChat into two UI messages and rebuilds `savedMessageIds` from `cardsSaved`.
- **cardsSaved persistence**: saving cards calls `markCardsSaved(chatId)` so the "Saved" chip survives reopening from history. Regenerate un-saves (`unmarkSaved`) because the answer changed.
- **History pagination (two-phase)**: phase 1 fetches only ordering data (groupBy sessionId `_max.createdAt` + standalone chat ids), builds time-sorted slots, paginates; phase 2 fetches full message content only for the current page. Sessions whose messages are empty are skipped. Standalone chats (`sessionId=null`) each count as their own single-message "session".
- **Media resolution guard**: `askQuestion` fetches MediaFiles scoped to `userId`; if `files.length !== mediaIds.length` → 400 `INVALID_MEDIA`. PDFs → `document` URL blocks, images → `image` URL blocks (files are public-read on S3, ingested by URL, no base64). Media attached only to the **latest** user turn.
- **`mediaIds` max 1**: DTO caps attachments at one file (F.1 PDF / F.2 image). Frontend optimistic `creditsUsed` for an attached message is 5 (PDF) / 3 (image), reconciled to the real charge on success.
- **Attach paywall nudge**: if `creditBalance < MIN_MEDIA_COST (3)`, the attach ActionSheet swaps its items for a disabled "Media costs 3–5 credits" row + "Upgrade to Premium" → Paywall.
- **Device picker edge cases** (`usePickMedia`): handles cancel (returns null silently), `permission` errorCode (toasts a Settings hint), and missing uri/type/fileName; PDFs use `copyTo: 'cachesDirectory'` and fall back to `result.uri`. Uploads count against storage quota like any other media.
- **Request timeout**: `aiApi.chat` overrides axios to 60s (flashcard generation on free models can exceed the default 15s).
- **Daily verse resilience**: 5s abort timeout; any error (network, non-OK, missing `random_verse`) returns the hardcoded John 3:16 — never throws to the client.
- **Rate limiting**: `POST /chat` is behind `aiRateLimit` middleware.
- **History building from UI**: `handleSend` reconstructs API history only from complete user+assistant pairs (orphaned user messages from failed calls are skipped), then caps to the last 20.

## This session's additions (A–G arc + post-G)

- **Phase B**: variable credit cost per action (text/cards) replacing a flat charge.
- **Phase F**: media in chat — F.1 PDF and F.2 image attachment from My Media or device, forcing Claude; `mediaIds` DTO field; provider seam + CLAUDE_MODEL pin.
- **Phase G**: G1 full-cost-upfront 402 for media; G3 out-of-credits Upgrade CTA in ChatInput.
- **Free-AI seam**: OpenRouter provider option with transient-failure retry for free/gemma-style models; empty-response guard so free-model flakiness never charges the user.
- **Achievements**: `askQuestion` calls `triggerAchievementCheck` (AI question count) — see [[Achievements]].
- **RAG pipeline** (450567a): Voyage AI embeddings on cards + notes → pgvector retrieval → personal context injected into system prompt per request.
- **Atomic credits** (b497ca5): TOCTOU race in credit reserve replaced with single atomic SQL UPDATE.
- **UI polish**: new session via `+` icon (replaced trash); single-container chat input redesign; KAV fix; keyboard dismissed on media attach.
- **Chat UI streamline** (e3214ed, 2026-08-14): `ChatBubble` simplified — avatar, sparkles badge, and inline credit chip removed. `ChatInput` always editable; send button gated by loading state only (not empty-input). `AIChatScreen` split into `useAIChatAttachment` hook + `ChatMessageItem` sub-component (Phase 4 god-screen split, `163fc52`).
- **Attachment UX v2** (d1ff479): image thumbnails + upload loading states — see below.

## Attachment UX (composer + bubble)

### Composer (`ChatInput`) states
| State | Image | PDF |
|-------|-------|-----|
| Uploading | 64×64 thumbnail, dark overlay, `ActivityIndicator` centered | Chip with spinner instead of file icon + "Uploading…" label, no ✕ |
| Ready | 64×64 thumbnail, ✕ button (top-right) | Chip with `FileTextIcon` + name + ✕ |

- `pendingLocalUri` state in `usePickMedia` — set before the upload starts, cleared after; drives the thumbnail during the upload window.
- `pickImage` / `takePhoto` now return `MediaFile & { localUri: string }` so the local file URI travels with the upload result and is stored in `attachment.localUri`.
- `ChatUIMessage` carries `attachmentType: 'IMAGE' | 'PDF'` and `attachmentLocalUri: string` so the bubble can render the right thing after send.

### Message bubble (sent)
- **IMAGE**: 200×150 rounded thumbnail (`Image` from the local URI) rendered above the chat bubble, right-aligned.
- **PDF**: existing pill chip (`FileTextIcon` + filename), no thumbnail.

### Key files
- `frontend/src/hooks/usePickMedia.ts` — `pendingLocalUri` state; extended return type
- `frontend/src/screens/ai/components/ChatInput.tsx` — thumbnail + spinner UI
- `frontend/src/screens/ai/AIChatScreen.tsx` — attachment state carries `localUri`; `renderItem` branches on `attachmentType`
- `frontend/src/store/aiChat.store.ts` — `ChatUIMessage.attachmentType` + `attachmentLocalUri` fields

## Related
[[Credits & Subscriptions]] · [[Notes & Media]] · [[Flashcards & Sets]] · [[Achievements]] · [[Home]] · [[Architecture Overview]] · [[Database Schema]]
