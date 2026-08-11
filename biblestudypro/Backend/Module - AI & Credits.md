---
tags: [backend, module, ai]
updated: 2026-08-08
---

# Module — AI & Credits

Paths: `backend/src/modules/ai/`, `backend/src/modules/credits/`.
Mounted at `/api/v1/ai` and `/api/v1/credits`.

## ai
The Bible-study AI assistant. Text chat routes through a **provider seam**; media
(PDF/image) always routes to Anthropic Claude.

- Handles a Q&A exchange, optionally grouped into a **session**, and can return
  **suggestedCards** (Json) the user can add to a set.
- Models: **AIChat** (`question`, `answer`, `suggestedCards`, `creditsUsed`,
  `sessionId`), **AIChatSession** (`title`, `tags`), **Bookmark**
  (unique `(userId, chatId)`) — see [[Database Schema]].
- Each answer **spends credits** → writes a `USAGE` **CreditTransaction**.
- Files: `ai.service.ts` (provider call + persistence), `ai.dto.ts`, controller, routes.

### Provider seam (`generateAnswer`)
- `env.AI_PROVIDER` = `anthropic` (default) | `openrouter`.
- **OpenRouter path** (text only): POSTs to `openrouter.ai/api/v1/chat/completions`
  using `OPENROUTER_API_KEY` + `AI_MODEL`. Lets free/cheap models serve text chat
  (sell outcomes, not the model). Free models cold-start and 429 — so it **retries
  transient 429/5xx** up to 3× with 1s→2s backoff before failing `AI_PROVIDER_ERROR`
  502. **No credit is charged on provider error.**
- **Claude path**: default provider, or **forced whenever media is attached** (vision /
  document blocks). Media-forced calls pin `CLAUDE_MODEL` (`claude-haiku-4-5`) rather
  than trust `AI_MODEL` (which may hold an OpenRouter id).

### Media in chat (Phase F)
- `dto.mediaIds[]` reference the caller's **MediaFile** rows (see [[Module - Media & Notes]]).
  PDFs → `document` blocks, images → `image` blocks, attached to the latest user turn
  by **public S3 URL** (no base64). Unknown ids → `INVALID_MEDIA` 400.
- Presence of media forces the Claude path (OpenRouter can't do vision/docs here).

### Variable credit cost
`CREDIT_COST = { text: 1, cards: 2, image: 3, pdf: 5 }`. Cost is chosen by what the AI
did, **media dominates**: `pdf > image > cards > text` (a media chat that also returns
cards is still charged the media rate — locked F decision #3).
- **Text/cards:** floored at the user's balance so it can never go negative (the AI
  already ran) — needs balance ≥ 1 to start.
- **Media (full-cost-upfront, G1):** the full `pdf`/`image` cost is required **before**
  the paid Claude call — rejects with `PaymentRequiredError` if the balance is short,
  so we never make a paid request we can't charge for.

## credits
The credit economy that gates AI usage.

- **CreditTransaction** ledger (`TransactionType`: `GRANT`/`REWARD`/`USAGE`/`PURCHASE`/…).
- Daily free claim on the client via `useAutoDailyClaim` (Home screen).
- `getStreak(userId)` derives study streaks from `REWARD` transactions — see [[Module - Gamification]].
- Model: `User` holds the plan + `creditBalance`; transactions form the ledger.
- Purchased/subscription credits are granted by [[Module - Subscriptions]].

## Client
- Hooks: `useAI`, `useCredits`, `useAutoDailyClaim` — see [[Hooks & API Layer]].
- Screens: AIChat, ChatHistory (sessions + bookmarks), Credits — see [[Screen Map]].

## Notes
- `AIChatSession` + `Bookmark` + `AIChat.sessionId`/`suggestedCards` were added
  in the [[Migration History|additive reconciliation migration]] (they existed in
  `schema.prisma`/code but were missing from migration history).
