---
title: Social
tags: [feature, social]
updated: 2026-08-10
---

# Social

> The social layer of BibleStudyPro: friends (leaderboard + shared sets + activity feed) and notifications (in-app + optional Firebase push). **Groups, Gatherings, and Map were fully removed (deferred post-launch)** — no backend modules, no hooks, no screens.

## Screens
One row per screen. All social screens live inside the **ProfileTab → ProfileNavigator** stack (see [[Navigation]]).

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| FriendsScreen | `Friends` | ProfileStack | Card rows with streak (from leaderboard cache) + friend count in title; trophy/search/bell header actions |
| FriendRequestsScreen | `FriendRequests` | ProfileStack | Incoming (count badge) / Sent tabs; card rows with relative timestamp; accept / reject / cancel |
| SearchUsersScreen | `SearchUsers` | ProfileStack | Card rows with church subtitle; ✓ friend / Sent pill / + add states |
| UserProfileScreen | `UserProfile` | ProfileStack | Profile info + relationship actions + **"Their Sets" section** (PUBLIC 🌐 + FRIENDS 👥 sets via `GET /sets/user/:userId`) |
| BlockedUsersScreen | `BlockedUsers` | ProfileStack | List blocked users; unblock |
| ~~GroupsScreen~~ | ~~`Groups`~~ | — | **REMOVED** |
| ~~GroupDetailScreen~~ | ~~`GroupDetail`~~ | — | **REMOVED** |
| ~~CreateGroupScreen~~ | ~~`CreateGroup`~~ | — | **REMOVED** |
| ~~EditGroupScreen~~ | ~~`EditGroup`~~ | — | **REMOVED** |
| ~~JoinGroupScreen~~ | ~~`JoinGroup`~~ | — | **REMOVED** |
| ~~PublicGroupsScreen~~ | ~~`PublicGroups`~~ | — | **REMOVED** |
| NotificationsScreen | `Notifications` | ProfileStack | Notifications grouped by date (Today/Yesterday/Earlier); swipe-to-delete; mark all read in header; tap navigates to relevant screen |
| — activity feed | (no screen) | — | Surfaced inline on **HomeScreen** via `useFriendsActivityFeed`, not its own screen |

## Features & functionality

### Friends (FriendsScreen / FriendRequestsScreen / SearchUsersScreen / UserProfileScreen / BlockedUsersScreen)
- **List friends** — card rows showing streak pulled from `useLeaderboard` cache (no extra query); friend count in title; header shortcuts to Leaderboard / FindFriends / Requests.
- **Leaderboard** — rank-aware motivational quote card (indigo verse-card style matching HomeScreen); ranked by current streak; medal emojis top 3; your row highlighted.
- **Search users** by query (name/email, case-insensitive); card rows with church subtitle; status: ✓ friend (green) / Sent pill (pending) / + add button.
- **Send friend request** → creates a PENDING `FriendRequest` and fires a `friend_request` notification to the receiver.
- **Requests screen** — Incoming tab shows count badge; card rows with relative timestamp (`formatDate`); incoming can **accept** or **reject**; outgoing can **cancel**.
- **UserProfileScreen** — profile info (avatar, church, bio, join date, mutual friends) + relationship action buttons + **"Their Sets" section**: fetches `GET /sets/user/:userId` which returns PUBLIC sets always and FRIENDS sets when viewer is friends; each set card shows title, card count, visibility emoji (🌐/👥), taps into LibraryTab → SetDetail.
- **Remove friend** deletes the friendship (both directions).
- **Block user** — rejects any pending requests, removes friendship, records a `Block`; **unblock** removes it. Blocked users listed on BlockedUsersScreen.

### Groups, Gatherings, Map — REMOVED (deferred post-launch)
The Groups, Gatherings, and Map cluster was fully removed — **no** `groups`/`gatherings`/`map` backend modules, no `Group`/`Gathering`/`GatheringParticipant` Prisma models, no `useGroups`/`useGatherings`/`useMap` hooks, no `gatheringsApi`/`mapApi`, no screens, and no nav routes. Deferred to post-launch.

### Activity feed
- `useFriendsActivityFeed` (infinite query) is rendered on **HomeScreen** only. Activities are logged automatically (`ADDED_FRIEND`, `CREATED_SET`, `CREATED_CARD`, `STUDIED_CARDS`, `CREATED_NOTE`).
- `GET /activities` (my feed) exists but has **no frontend consumer**.

### Notifications (NotificationsScreen)
- Notifications grouped by date: **Today / Yesterday / Earlier** (empty buckets omitted) using `SectionList`.
- **Swipe left** to reveal a red delete button; tap to confirm delete (not auto-delete on swipe).
- **Mark all read** lives in the header right slot (only visible when `unreadCount > 0`).
- **Tap to navigate**: `friend_request` → FriendRequests, `friend_accepted` → Friends, `achievement` → Achievements, `system` → mark read only.
- Tapping also marks the notification read if it was unread.
- Back button uses `navigation.navigate('Profile')` (not `goBack()`) so the Home bell cross-tab navigate doesn't leave Notifications stuck in the Profile stack.
- Each row renders a type-specific icon via `getNotificationIcon` — see the crash-fix gotcha below.

## Data flow
- Friends: `FriendsScreen → useFriends (['friends']) → friendsApi.list → GET /friends → controller → service → Prisma`. Requests use `['friends','requests',type]`; search `['users','search',q]`; blocked `['friends','blocked']`. Mutations invalidate the relevant `['friends' ...]` / `['users' ...]` keys.
- Groups / Gatherings / Map: **REMOVED** (deferred post-launch) — no backend, no hooks, no api.
- Activities: `useFriendsActivityFeed (['activities','friends'])` → `activitiesApi.getFriendsFeed` → `GET /activities/friends`.
- Notifications: `useNotifications (['notifications', page])` → `notificationsApi.list` → `GET /notifications`. Mutations invalidate `['notifications']`.

## Backend
Each module = `<m>.routes.ts` · `<m>.controller.ts` · `<m>.service.ts` (owns Prisma) · `<m>.dto.ts`. All routers `router.use(authMiddleware)` — every endpoint is authenticated. Base = `/api/v1`.

### friends — `backend/src/modules/friends/`
Endpoints:
- `GET /friends` — list accepted friends.
- `GET /friends/search?q=` — search users (paginated; excludes self + blocked; returns relationship state).
- `GET /friends/leaderboard` — friend leaderboard (streak/points).
- `GET /friends/requests?type=incoming|outgoing` — pending requests.
- `GET /friends/blocked` — blocked users.
- `POST /friends/request` — send (body `receiverId`).
- `PUT /friends/request/:requestId/accept` · `PUT /friends/request/:requestId/reject` · `DELETE /friends/request/:requestId` (cancel).
- `POST /friends/block/:userId` · `DELETE /friends/block/:userId` (unblock).
- `DELETE /friends/:friendId` — remove friend.

Service guards: `sendRequest` rejects self (`ValidationError`), missing receiver (404), blocked pair (`ValidationError`), already-friends (`ConflictError`), pending in either direction (`ConflictError`); uses upsert to re-open a previously-rejected request. `accept/reject` require the row to be `receiverId===me & PENDING`; `cancel` requires `senderId===me & PENDING`. `blockUser` rejects self-block, auto-rejects pending requests both ways, removes friendship.

> **Groups / Gatherings / Map backend modules were removed** (deferred post-launch) — no `groups`/`gatherings`/`map` routes exist.

### activities — `backend/src/modules/activities/`
Endpoints: `GET /activities` (my feed), `GET /activities/friends` (friends' feed). Both paginated. Writing is done by the shared `src/utils/activity.ts` `logActivity(userId, type, referenceId)` called from other modules — no write endpoint.

### notifications — `backend/src/modules/notifications/`
Endpoints: `GET /notifications`, `PUT /notifications/read-all`, `PUT /notifications/:id/read`, `DELETE /notifications/:id`. No DTOs. Read/delete guard on `userId` ownership (404 otherwise). Notifications are **created** by the shared `src/utils/notifications.ts` `sendPushToUser(userId, title, body, data)`, not by this module.

### DTOs (zod)
- friends `SendRequestDto`: `{ receiverId: uuid }`.

## Data model
Prisma (`backend/prisma/schema.prisma`), all `onDelete: Cascade` from User:
- **FriendRequest** — senderId, receiverId, `status FriendRequestStatus (PENDING/ACCEPTED/REJECTED)`. `@@unique([senderId, receiverId])`.
- **Friendship** — userId, friendId. `@@unique([userId, friendId])` (stored bidirectionally — two rows per friendship).
- **Block** — blockerId, blockedId. `@@unique([blockerId, blockedId])`.
- **Activity** — userId, `type ActivityType`, referenceId?. `@@index([userId, createdAt])`.
- **Notification** — userId, title, body, **`type: String`** (free-form, not an enum), referenceId?, `read` default false.

> `Group`/`GroupMember`/`Gathering`/`GatheringParticipant` models, the `ParticipantStatus` enum, and the `User` location/`locationPrivacy` fields were removed (deferred post-launch).

## Edge cases, rules & gotchas
- **Notification `type` is a free-form String in the DB, not an enum.** The frontend union in `types/notification.types.ts` is `friend_request | friend_accepted | achievement | system`. Backend emits: `friend_request`, `friend_accepted`, plus `achievement` (from [[Gamification]]) and a default `general` when `data.type` is absent in `sendPushToUser`. (`group`/`gathering`/`gathering_rsvp` types were removed with those features.)
- **Crash-fix (unknown notification type → default icon):** `getNotificationIcon` in NotificationsScreen is a `switch` whose `default` (and `system`) returns `BellIcon`. This deliberately guards against any backend `type` the app doesn't know yet (e.g. `general`, or new types) so an unmapped type can't crash the row render. Do not remove the default case.
- **Push notifications are optional.** `sendPushToUser` always persists the in-app `Notification` row, then only sends FCM if all three `FIREBASE_*` env vars are set (dev has none → push silently skipped, server never crashes). Multicast to `DeviceToken` rows; stale/invalid tokens are pruned; all push errors are caught and logged, never rethrown (non-critical path).
- **Friendship stored bidirectionally** (two rows). Removing/blocking must clear both directions.
- **Friend request re-open:** a REJECTED request can be re-sent (upsert flips it back to PENDING) — not a hard block.
- **Groups / Gatherings / Map removed:** the whole cluster was deleted from backend and frontend (deferred post-launch). See [[Navigation]].
- **Activity feed is home-only:** `useFriendsActivityFeed` renders inside HomeScreen; there is no dedicated activity screen, and `GET /activities` (my feed) has no client consumer.
- **`achievement` notifications** originate from [[Gamification]] (achievement unlocks), routed through the same `sendPushToUser` path.

## Set sharing & referral (2026-09-13, commits `7d8f006`+`72ebe4b`)
- **Per-set share links.** Public `GET /api/v1/sets/shared/:id` (unauth, defined *before* `authMiddleware` in `sets.routes`; `getSharedSet` service returns PUBLIC-only sets — private/friends 404) backs the `getverdance.com/s.html?id=<id>` landing page (`legal/s.html`, served static by Caddy from `/var/www/getverdance`). `utils/share.ts` `buildSetShareLink` emits the `/s` link for PUBLIC sets, homepage otherwise; the share *message* still carries the full card text regardless.
- **WhatsApp 1-tap.** `shareToWhatsApp` opens `https://wa.me/?text=` (universal link — works both platforms, no iOS `LSApplicationQueriesSchemes` entry needed), falling back to the system sheet. SetDetail share button → ActionSheet [WhatsApp · More…].
- **Tell-a-pastor (#2).** Profile "Invite" → ActionSheet [Invite a friend · Tell your pastor / group leader] with tailored copy. Invite/footer strings are default-only (English) like their siblings — not in locale JSON.
- **Deferred:** native universal/App Links (open the set inside an installed app) — share recipients rarely have the app, so the web landing is the growth surface; needs iOS entitlement+AASA / Android assetlinks + rebuilds.

## Change log
- **2026-08-10**: Friends feature fully redesigned (commit `123332b`) — card rows throughout, streak on friends list, leaderboard quote card, requests timestamps + badge, UserProfile "Their Sets" section, new `GET /sets/user/:userId` backend endpoint.
- **2026-08-10**: NotificationsScreen redesigned (commit `40418c7`) — date grouping, swipe-to-delete, mark-all-read in header, tap-to-navigate per type, back button fix.
- **2026-08-10**: Groups feature removed from the app (frontend screens + routes gone).
- **A–G arc**: `achievement` notification type + icon added alongside the [[Gamification]] achievements module. Notification icon-mapping default-case crash fix.

## Related
[[Gamification]] · [[Study Plans]] · [[Navigation]] · [[Architecture Overview]] · [[Database Schema]]
