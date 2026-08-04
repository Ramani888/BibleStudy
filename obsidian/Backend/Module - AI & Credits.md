---
tags: [backend, module, ai]
---

# Module — AI & Credits

Paths: `backend/src/modules/ai/`, `backend/src/modules/credits/`.
Mounted at `/api/v1/ai` and `/api/v1/credits`.

## ai
The Bible-study AI assistant (Anthropic Claude via `ANTHROPIC_API_KEY`).

- Handles a Q&A exchange, optionally grouped into a **session**, and can return
  **suggestedCards** (Json) the user can add to a set.
- Models: **AIChat** (`question`, `answer`, `suggestedCards`, `creditsUsed`,
  `sessionId`), **AIChatSession** (`title`, `tags`), **Bookmark**
  (unique `(userId, chatId)`) — see [[Database Schema]].
- Each answer **spends credits** → writes a **CreditTransaction**.
- Files: `ai.service.ts` (Claude call + persistence), `ai.dto.ts`, controller, routes.

## credits
The credit economy that gates AI usage.

- **CreditTransaction** ledger (`TransactionType` = grant/spend/…).
- Daily free claim on the client via `useAutoDailyClaim` (Home screen).
- Model: `User` holds the plan; transactions form the running balance.

## Client
- Hooks: `useAI`, `useCredits`, `useAutoDailyClaim` — see [[Hooks & API Layer]].
- Screens: AIChat, ChatHistory (sessions + bookmarks), Credits — see [[Screen Map]].

## Notes
- `AIChatSession` + `Bookmark` + `AIChat.sessionId`/`suggestedCards` were added
  in the [[Migration History|additive reconciliation migration]] (they existed in
  `schema.prisma`/code but were missing from migration history).
