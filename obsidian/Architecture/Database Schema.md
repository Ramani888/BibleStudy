---
tags: [architecture, backend, database]
---

# Database Schema

PostgreSQL 16 via Prisma 5. Schema: `backend/prisma/schema.prisma`. Migration
timeline & the 2026-08-04 reconciliation: [[Migration History]].

## Models by domain

### Identity & auth
- **User** — the root entity; owns almost everything. Has `plan`, `storageLimit`
  (default 250 MB), `profileImage`.
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

### AI & credits
- **AIChat** — a Q&A exchange: `question`, `answer`, `suggestedCards` (Json),
  `creditsUsed`, optional `sessionId`.
- **AIChatSession** — groups chats into a conversation; `title`, `tags`.
- **Bookmark** — user-bookmarked chats; unique `(userId, chatId)`.
- **CreditTransaction** — ledger of credit grants/spends (`TransactionType`).

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

`Plan` · `Platform` · `Visibility` · `CardLayout` · `Difficulty` ·
`TransactionType` · `MediaType` (IMAGE|PDF) · `FriendRequestStatus` ·
`GroupRole` · `ParticipantStatus` · `LocationPrivacy` · `ActivityType`

## Key relational facts

- **User is the god node** — cascade-deletes to Folders, Sets, Cards, Notes,
  MediaFiles, AIChats, Sessions, Bookmarks, social records.
- **Folder self-FK** (`parentId → Folder.id`, `onDelete: Cascade`) enables nested
  folders — added in the [[Migration History|additive reconciliation migration]].
- **Bookmark → AIChat** cascade; unique per `(userId, chatId)`.

## Migrations status
As of 2026-08-04, migrations apply cleanly from scratch with **zero drift** vs
`schema.prisma`. Details: [[Migration History]].
