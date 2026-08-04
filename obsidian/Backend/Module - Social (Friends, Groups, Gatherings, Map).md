---
tags: [backend, module, social]
---

# Module — Social (Friends, Groups, Gatherings, Map)

The community layer — **absent from CLAUDE.md** but a large part of the app.
Paths: `backend/src/modules/{friends,groups,gatherings,map,activities,notifications}/`.

## friends
Friend requests, friendships, and blocking.
- Models: **FriendRequest** (`FriendRequestStatus`), **Friendship**, **Block**.
- Screens: Friends, FriendRequests, SearchUsers, UserProfile, BlockedUsers.
- Enables friends-only set sharing (FriendsSets — see
  [[Module - Library (Folders, Sets, Cards)]]).

## groups
Study groups with roles.
- Models: **Group**, **GroupMember** (`GroupRole`).
- Public group discovery + join flow.
- Screens: Groups, GroupDetail, Create/Edit Group, JoinGroup, PublicGroups.

## gatherings + map
In-person events plotted on a map.
- Models: **Gathering** (location), **GatheringParticipant**
  (`ParticipantStatus`), with `LocationPrivacy` controlling map exposure.
- `map` module serves nearby gatherings/users for the [[Navigation|MapTab]].
- Screens: Map, GatheringDetail, Create/Edit Gathering.

## activities
The activity feed.
- Model: **Activity** (`ActivityType`, incl. `CREATED_CARD`).
- Written via `utils/activity.ts` from other modules (e.g. creating a card).

## notifications
In-app + push notifications.
- Model: **Notification**; push via **DeviceToken** and `utils/notifications.ts`.
- Screen: Notifications.

## Client
Hooks: `useFriends`, `useGroups`, `useGatherings`, `useMap`, `useActivities`,
`useNotifications` — see [[Hooks & API Layer]]. Most screens live in the Profile
and Map stacks — see [[Navigation]] / [[Screen Map]].
