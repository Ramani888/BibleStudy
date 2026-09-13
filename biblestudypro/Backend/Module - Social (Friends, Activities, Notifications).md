---
tags: [backend, module, social]
---

# Module — Social (Friends, Activities, Notifications)

The community layer. Real paths: `backend/src/modules/{friends,activities,notifications}/`.

> **Groups, Gatherings, and Map are NOT implemented** — no backend modules, no
> models, no screens, no hooks, no nav routes. Deferred to post-launch (see repo
> `CLAUDE.md` "Known gaps"). This note previously documented them as if they
> existed; corrected 2026-09-13.

## friends
Friend requests, friendships, and blocking.
- Models: **FriendRequest** (`FriendRequestStatus`), **Friendship**, **Block**.
- Screens: Friends, FriendRequests, SearchUsers, UserProfile, BlockedUsers.
- Enables friends-only set sharing (FriendsSets — see
  [[Module - Library (Folders, Sets, Cards)]]) and the streak leaderboard
  (`GET /api/v1/friends/leaderboard`).
- **Set sharing / referral** (per-set links, WhatsApp, tell-a-pastor) lives in
  [[Social]] on the feature side.

## activities
The activity feed.
- Model: **Activity** (`ActivityType`, incl. `CREATED_CARD`).
- Written via `utils/activity.ts` from other modules (e.g. creating a card).

## notifications
In-app + push notifications.
- Model: **Notification**; push via **DeviceToken** and `utils/notifications.ts`.
- Screen: Notifications. Scheduled pushes + triggers: see [[Push Notifications]].

## Client
Hooks: `useFriends`, `useActivities`, `useNotifications` — see
[[Hooks & API Layer]]. Screens live in the Profile stack — see [[Screen Map]].
