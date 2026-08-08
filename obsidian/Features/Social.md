---
title: Social
tags: [feature, social]
updated: 2026-08-08
---

# Social

> The social layer of BibleStudyPro: friends, groups (with roles + invite codes + public discovery + group [[Study Plans]]), in-person gatherings on a map, an activity feed, and notifications (in-app + optional Firebase push).

## Screens
One row per screen. All social screens live inside the **ProfileTab → ProfileNavigator** stack (see [[Navigation]]). The `map/` + gathering screens are **NOT built** on the frontend (see gotchas).

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| FriendsScreen | `Friends` | ProfileStack | List accepted friends; entry to requests/search/blocked; remove friend |
| FriendRequestsScreen | `FriendRequests` | ProfileStack | Incoming/outgoing request tabs; accept / reject / cancel |
| SearchUsersScreen | `SearchUsers` | ProfileStack | Search users by name/email; send request; open profile |
| UserProfileScreen | `UserProfile` | ProfileStack | Other user's profile + relationship-aware actions (send/cancel/accept/reject/remove/block) |
| BlockedUsersScreen | `BlockedUsers` | ProfileStack | List blocked users; unblock |
| GroupsScreen | `Groups` | ProfileStack | List my groups; entry to create/join/public/detail |
| GroupDetailScreen | `GroupDetail` | ProfileStack | Group info, members + role management, invite share, group [[Study Plans]] section, leave/delete |
| CreateGroupScreen | `CreateGroup` | ProfileStack | Create a group (name/desc/visibility) |
| EditGroupScreen | `EditGroup` | ProfileStack | Edit group (admin only) |
| JoinGroupScreen | `JoinGroup` | ProfileStack | Join via invite code |
| PublicGroupsScreen | `PublicGroups` | ProfileStack | Discover + join PUBLIC groups (search) |
| NotificationsScreen | `Notifications` | ProfileStack | List notifications, mark read / mark all read / delete |
| — activity feed | (no screen) | — | Surfaced inline on **HomeScreen** via `useFriendsActivityFeed`, not its own screen |
| MapScreen / GatheringDetail / CreateGathering / EditGathering | — | **not built** | Backend + hooks exist; **no frontend screens, no routes** |

## Features & functionality

### Friends (FriendsScreen / FriendRequestsScreen / SearchUsersScreen / UserProfileScreen / BlockedUsersScreen)
- **List friends** with a friend leaderboard (streak/points based) available via `useLeaderboard`.
- **Search users** by query (name/email, case-insensitive), paginated; excludes self, excludes blocked, and each result carries relationship state so the UI shows the right action.
- **Send friend request** → creates a PENDING `FriendRequest` and fires a `friend_request` notification to the receiver.
- **Requests screen** has incoming/outgoing tabs: incoming can **accept** (creates bidirectional friendship + `friend_accepted` notification back to sender + `ADDED_FRIEND` activity) or **reject**; outgoing can **cancel**.
- **UserProfileScreen** is the relationship hub — it wires all six friend hooks (send/cancel/accept/reject/remove/block) and branches on `user.pendingRequest` / friendship status.
- **Remove friend** deletes the friendship (both directions).
- **Block user** — rejects any pending requests between the two, removes friendship, records a `Block`; **unblock** removes it. Blocked users listed on BlockedUsersScreen.

### Groups (GroupsScreen / GroupDetailScreen / Create / Edit / Join / PublicGroups)
- **Create group**: name (required, ≤100), description (≤500), visibility (PRIVATE default / PUBLIC / FRIENDS). Creator becomes an ADMIN member + is the `ownerId`.
- **My groups** list; **public groups** discovery with search (only `visibility=PUBLIC`).
- **GroupDetailScreen**: shows members with role badges, invite-code **Share** sheet, **Study Plans** section, and role-gated management.
  - **Role management** (admin only, cannot target the owner or self): promote/demote between ADMIN/MEMBER, remove member.
  - **Study Plans section** — lists group plans via `useGroupPlans(groupId)`; admins see a "New" affordance → `CreateGroupPlan`; rows open `GroupPlanDetail`. See [[Study Plans]].
  - **Leave group** (blocked if you're the last admin), **Delete group** (owner/authorized only, cascades all data).
  - **Regenerate invite code** (admin) → new UUID invite code.
- **Join group**: JoinGroupScreen (paste invite code) or PublicGroupsScreen (tap a public group → joins by its invite code → navigates to GroupDetail). Joining fires a `group` notification to existing admins.

### Gatherings + Map (BACKEND + HOOKS ONLY — no UI)
- Backend supports: create gathering (optionally tied to a group), list, nearby (haversine radius, default 50km), get, update, cancel, **RSVP** (GOING/MAYBE/NOT_GOING), leave, list participants. Host auto-RSVPs GOING; creating a group gathering notifies group members (`gathering`); RSVP notifies the host (`gathering_rsvp`).
- Map backend: update my location, get friends' locations (privacy-filtered), nearby gatherings, update location privacy (OFF/FRIENDS/SELECTED/EVERYONE).
- Frontend hooks `useGatherings` / `useMap` exist and are typed, but **no screens consume them** and **no routes exist** — dormant.

### Activity feed
- `useFriendsActivityFeed` (infinite query) is rendered on **HomeScreen** only. Activities are logged automatically (`ADDED_FRIEND`, `JOINED_GROUP`, `JOINED_GATHERING`, `CREATED_SET`, `CREATED_CARD`, `STUDIED_CARDS`, `CREATED_NOTE`).
- `GET /activities` (my feed) exists but has **no frontend consumer**.

### Notifications (NotificationsScreen)
- Paginated list with `unreadCount`; **mark one read**, **mark all read**, **delete**.
- Each row renders a type-specific icon via `getNotificationIcon` — see the crash-fix gotcha below.

## Data flow
- Friends: `FriendsScreen → useFriends (['friends']) → friendsApi.list → GET /friends → controller → service → Prisma`. Requests use `['friends','requests',type]`; search `['users','search',q]`; blocked `['friends','blocked']`. Mutations invalidate the relevant `['friends' ...]` / `['users' ...]` keys.
- Groups: `GroupsScreen → useGroups (['groups']) → groupsApi.list → GET /groups`. Detail `['groups', id]`; public `['groups','public',search]`. Mutations invalidate `['groups']` / `['groups', id]`.
- Gatherings: `useGatherings (['gatherings','list',params])`, detail `['gatherings','detail',id]`, nearby `['gatherings','nearby',lat,lng]` → `gatheringsApi.*` → `/gatherings/*` (no screen wired).
- Map: `useFriendsLocations (['map','friends'])` → `mapApi.*` → `/map/*` (no screen wired).
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

### groups — `backend/src/modules/groups/`
Endpoints: `POST /groups`, `GET /groups`, `GET /groups/public`, `GET /groups/:id`, `PUT /groups/:id`, `DELETE /groups/:id`, `POST /groups/join/:inviteCode`, `DELETE /groups/:id/leave`, `PUT /groups/:id/members/:uid/role`, `DELETE /groups/:id/members/:uid`, `POST /groups/:id/regenerate-invite`.
Service: private `verifyGroupAdmin` (member with role ADMIN else `ForbiddenError`). `createGroup` makes creator an ADMIN member. `getGroup` requires membership (404 if not a member — hides existence). `joinGroup` → `ConflictError` if already a member; notifies other admins (`group`). `leaveGroup` blocks the **last admin** (`ValidationError`). `updateMemberRole`/`removeMember` are admin-gated and **cannot demote/remove the owner**. `regenerateInviteCode` sets a fresh `randomUUID()`. `listPublicGroups` filters `visibility=PUBLIC` with optional search + pagination. `notifyGroupMembers` fan-outs notifications.

### gatherings — `backend/src/modules/gatherings/`
Endpoints: `POST /gatherings`, `GET /gatherings`, `GET /gatherings/nearby`, `GET /gatherings/:id`, `PUT /gatherings/:id`, `DELETE /gatherings/:id` (cancel), `POST /gatherings/:id/rsvp`, `DELETE /gatherings/:id/leave`, `GET /gatherings/:id/participants`.
Service: create requires membership if `groupId` given (`ForbiddenError`), host auto-RSVPs GOING, group gatherings notify members (`gathering`). Visibility filters PUBLIC / FRIENDS(-only via friendship check) on list/nearby/get (returns 404 to hide non-visible). `rsvp` upserts participant status, notifies host (`gathering_rsvp`). `leaveGathering` blocks the host (`ValidationError` — "cancel instead").

### map — `backend/src/modules/map/`
Endpoints: `POST /map/location`, `GET /map/friends`, `GET /map/gatherings`, `PUT /map/privacy`.
Service: `updateLocation` writes `locationLat/Lng/Name` + `lastLocationAt` on the **User** row (no separate location table). `getFriendsLocations` returns friends whose `locationPrivacy` is FRIENDS/SELECTED/EVERYONE and who have coords. `getNearbyGatherings` delegates to gatherings `getNearby`. `updatePrivacy` sets `locationPrivacy`.

### activities — `backend/src/modules/activities/`
Endpoints: `GET /activities` (my feed), `GET /activities/friends` (friends' feed). Both paginated. Writing is done by the shared `src/utils/activity.ts` `logActivity(userId, type, referenceId)` called from other modules — no write endpoint.

### notifications — `backend/src/modules/notifications/`
Endpoints: `GET /notifications`, `PUT /notifications/read-all`, `PUT /notifications/:id/read`, `DELETE /notifications/:id`. No DTOs. Read/delete guard on `userId` ownership (404 otherwise). Notifications are **created** by the shared `src/utils/notifications.ts` `sendPushToUser(userId, title, body, data)`, not by this module.

### DTOs (zod)
- friends `SendRequestDto`: `{ receiverId: uuid }`.
- groups `CreateGroupDto`: name 1–100, description ≤500 optional, visibility enum optional. `UpdateGroupDto` = partial. `UpdateRoleDto`: `{ role: 'ADMIN'|'MEMBER' }`.
- gatherings `CreateGatheringDto`: title 1–200, desc ≤1000, `date` ISO datetime, groupId uuid?, locationName ≤200, lat −90..90, lng −180..180, meetingLink url?, visibility enum?. `UpdateGatheringDto` = partial. `RsvpDto`: `{ status: 'GOING'|'MAYBE'|'NOT_GOING' }`.
- map `UpdateLocationDto`: lat/lng bounded, locationName ≤200 optional. `PrivacyDto`: `{ privacy: 'OFF'|'FRIENDS'|'SELECTED'|'EVERYONE' }`.

## Data model
Prisma (`backend/prisma/schema.prisma`), all `onDelete: Cascade` from User:
- **FriendRequest** — senderId, receiverId, `status FriendRequestStatus (PENDING/ACCEPTED/REJECTED)`. `@@unique([senderId, receiverId])`.
- **Friendship** — userId, friendId. `@@unique([userId, friendId])` (stored bidirectionally — two rows per friendship).
- **Block** — blockerId, blockedId. `@@unique([blockerId, blockedId])`.
- **Group** — name, description?, ownerId, `visibility Visibility (PRIVATE/PUBLIC/FRIENDS)`, `inviteCode @unique @default(uuid())`; has members + gatherings.
- **GroupMember** — composite `@@id([groupId, userId])`, `role GroupRole (ADMIN/MEMBER)`.
- **Gathering** — title, desc?, hostId, groupId?, date, location fields, meetingLink?, `visibility` default FRIENDS. `groupId` is `onDelete: SetNull`.
- **GatheringParticipant** — composite `@@id([gatheringId, userId])`, `status ParticipantStatus (GOING/MAYBE/NOT_GOING)`.
- **Activity** — userId, `type ActivityType`, referenceId?. `@@index([userId, createdAt])`.
- **Notification** — userId, title, body, **`type: String`** (free-form, not an enum), referenceId?, `read` default false.
- **User** location fields: `locationLat/Lng/Name`, `lastLocationAt`, `locationPrivacy LocationPrivacy (OFF/FRIENDS/SELECTED/EVERYONE)` default OFF. **No separate location table.**

## Edge cases, rules & gotchas
- **Notification `type` is a free-form String in the DB, not an enum.** The frontend union in `types/notification.types.ts` is `friend_request | friend_accepted | group | gathering | gathering_rsvp | achievement | system`. Backend emits: `friend_request`, `friend_accepted`, `group`, `gathering`, `gathering_rsvp`, plus `achievement` (from [[Gamification]]) and a default `general` when `data.type` is absent in `sendPushToUser`.
- **Crash-fix (unknown notification type → default icon):** `getNotificationIcon` in NotificationsScreen is a `switch` whose `default` (and `system`) returns `BellIcon`. This deliberately guards against any backend `type` the app doesn't know yet (e.g. `general`, or new types) so an unmapped type can't crash the row render. Do not remove the default case.
- **Push notifications are optional.** `sendPushToUser` always persists the in-app `Notification` row, then only sends FCM if all three `FIREBASE_*` env vars are set (dev has none → push silently skipped, server never crashes). Multicast to `DeviceToken` rows; stale/invalid tokens are pruned; all push errors are caught and logged, never rethrown (non-critical path).
- **Friendship stored bidirectionally** (two rows). Removing/blocking must clear both directions.
- **Friend request re-open:** a REJECTED request can be re-sent (upsert flips it back to PENDING) — not a hard block.
- **Group owner is protected:** cannot be demoted or removed via member management; owner distinct from ADMIN role. Last-admin cannot leave.
- **Group existence hidden:** `getGroup` returns 404 to non-members; gathering visibility returns 404 to non-permitted viewers rather than 403.
- **Map privacy SELECTED is a stub:** it currently behaves exactly like FRIENDS — a `SelectedLocationUser` join table is a documented TODO in `map.service.ts`.
- **Nearby search** is an in-service haversine filter (default radius 50km), not a PostGIS query — fine at current scale.
- **DORMANT / UNREACHABLE — Map + Gatherings have NO frontend:** despite the CLAUDE.md note, there is **no `frontend/src/screens/map/` directory at all** (no MapScreen/GatheringDetail/CreateGathering/EditGathering) and **no Map/Gathering routes in `navigation/types.ts`**. Only the backend modules (`map`, `gatherings`) and the typed hooks (`useMap`, `useGatherings`) exist. The whole feature is backend-complete but entirely unmounted/unbuilt on the client. See [[Navigation]].
- **Activity feed is home-only:** `useFriendsActivityFeed` renders inside HomeScreen; there is no dedicated activity screen, and `GET /activities` (my feed) has no client consumer.
- **`achievement` notifications** originate from [[Gamification]] (achievement unlocks), routed through the same `sendPushToUser` path.

## This session's additions (A–G arc)
- Group **Study Plans section** in GroupDetailScreen (`useGroupPlans`, `CreateGroupPlan` / `GroupPlanDetail` routes) is the entry point for group plans — the church-revenue D2 direction. See [[Study Plans]].
- `achievement` notification type + icon added alongside the [[Gamification]] achievements module.
- Notification icon-mapping default-case crash fix landed to tolerate unknown/new backend `type` strings.

## Related
[[Gamification]] · [[Study Plans]] · [[Navigation]] · [[Architecture Overview]] · [[Database Schema]]
