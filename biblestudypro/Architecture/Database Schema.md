---
tags: [architecture, backend, database]
updated: 2026-08-08
---

# Database Schema

PostgreSQL 16 via Prisma 5. Schema: `backend/prisma/schema.prisma`. Migration
timeline & the 2026-08-04 reconciliation: [[Migration History]].

## Models by domain

### Identity & auth
- **User** — the root entity; owns almost everything. Monetization fields:
  `plan` (Plan enum, default `FREE`), `storageUsed` / `storageLimit` (both
  `BigInt`; limit default 262144000 = 250 MB), plus `subscription` (1:1 optional
  relation → **Subscription**). Also `profileImage`, `googleId`/`appleId`
  (unique, nullable), `password` nullable (social-only accounts).
- **RefreshToken** — persisted refresh tokens (rotation). See [[Auth & Token Flow]].
- **DeviceToken** — push notification device registrations.
- **OtpToken** — email-verification / reset OTPs (indexed by `email`).

### Study core
- **Folder** — container; **self-referential** via `parentId` (nested folders).
- **Set** — a flashcard set (belongs to a Folder / User); has `visibility`, `color`.
- **Card** — a flashcard in a Set; `layout`, `difficulty`, optional `note`.
- **Note** — standalone user notes: `title`, `body` (Text), `tags String[]`.
  *(Redefined from the legacy init shape — see [[Migration History]].)*
- **MediaFile** — uploaded media (image/PDF) in S3: `key` (unique), `url`,
  `mimeType`, `sizeBytes`, `type` (MediaType). Replaced the old `File` table.
- **QuizAttempt** — a finished quiz's result: `userId`, `setId`, `total`,
  `correct`, `scorePct`. One row per completed quiz. See [[Quiz Feature]].

### Study plans (see [[Study Plans]])
- **StudyPlan** — an ordered plan owned by a User: `title`, `description`,
  nullable `groupId` (**null = personal (D1); set = group plan (D2)**).
- **StudyPlanStep** — one step in a plan → a `Set` (`planId`, `setId`, `order`,
  optional `title`). Cascade-deletes with its plan and its set.
- **StudyPlanProgress** — per-user step completion; composite PK
  `@@id([userId, stepId])`, `completedAt`. Lets group plans track each member
  independently against shared steps.

### Gamification (see [[Gamification]])
- **UserAchievement** — unlocked-achievement record; composite PK
  `@@id([userId, key])` (`key` references a code-defined achievement — there are
  17 definitions in the achievements module, no DB table for the catalogue),
  `unlockedAt`.

### AI & credits (see [[Credits & Subscriptions]])
- **AIChat** — a Q&A exchange: `question`, `answer`, `suggestedCards` (Json),
  `followUps` (`String[]`, suggested next questions), `cardsSaved` (Boolean —
  whether the user saved the proposed cards), `creditsUsed`, optional `sessionId`.
- **AIChatSession** — groups chats into a conversation; `title`, `tags`.
- **Bookmark** — user-bookmarked chats; unique `(userId, chatId)`.
- **CreditTransaction** — ledger of credit grants/spends (`TransactionType`).
- **Subscription** — 1:1 with User (`userId` unique). Holds the store
  entitlement: `plan` (Plan), `store` (Store enum), `productId`, `expiresAt`,
  `originalTransactionId` (**unique**), `lastTransactionId`. IAP-backed, not
  Stripe.

### Social layer
- **FriendRequest** — pending/accepted/declined (`FriendRequestStatus`).
- **Friendship** — established mutual friendship.
- **Block** — user blocks (indexed by `blockedId`).
- **Group** — a study group; **GroupMember** join table with `GroupRole`.
- **Gathering** — an in-person event with location; **GatheringParticipant**
  join with `ParticipantStatus`; `LocationPrivacy` controls map exposure.
- **Activity** — activity-feed entries (`ActivityType`, incl. `CREATED_CARD`).
- **Notification** — in-app notifications.

## Enums

`CardType` · `Plan` (FREE|STARTER|PRO) · `Store` (APPLE|GOOGLE) · `Platform` ·
`Visibility` · `CardLayout` · `Difficulty` · `TransactionType` ·
`MediaType` (IMAGE|PDF) · `FriendRequestStatus` · `GroupRole` ·
`ParticipantStatus` · `LocationPrivacy` · `ActivityType`

## Key relational facts

- **User is the god node** — cascade-deletes to Folders, Sets, Cards, Notes,
  MediaFiles, AIChats, Sessions, Bookmarks, social records, achievements,
  study plans, plan progress, and its 1:1 Subscription.
- **Folder self-FK** (`parentId → Folder.id`, `onDelete: Cascade`) enables nested
  folders — added in the [[Migration History|additive reconciliation migration]].
- **Bookmark → AIChat** cascade; unique per `(userId, chatId)`.

## Migrations status
As of 2026-08-04, migrations apply cleanly from scratch with **zero drift** vs
`schema.prisma`. Details: [[Migration History]].
