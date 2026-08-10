---
title: Push Notifications
tags: [feature, notifications, firebase]
updated: 2026-08-10
---

# Push Notifications

> Real device push notifications via Firebase Cloud Messaging (FCM), layered on top of the existing in-app notification feed. Both always fire together — `sendPushToUser()` persists a DB row AND sends the push in one call.

## Status

| Layer | Status |
|---|---|
| `DeviceToken` DB model | ✅ |
| `POST /users/device-token` (register on login) | ✅ |
| `POST /users/device-token/remove` (on logout) | ✅ |
| `sendPushToUser()` backend utility | ✅ |
| Friend request push | ✅ wired |
| Friend accepted push | ✅ wired |
| Achievement unlock push | ✅ wired |
| `firebase-admin` installed (backend) | ✅ |
| `@react-native-firebase/app` + `messaging` (frontend) | ✅ |
| `GoogleService-Info.plist` (iOS) | ✅ `4d5f209` — project `biblestudy-2b14c` |
| `google-services.json` (Android) | ✅ `4d5f209` — project `biblestudy-2b14c` |
| `FIREBASE_*` env vars in `backend/.env` | ⏳ **Pending** — generate service account key |
| APNs key uploaded to Firebase | ⏳ **Pending** — Apple Developer → Keys → APNs |

## To activate (remaining steps)

1. Firebase Console → `biblestudy-2b14c` → Project Settings → **Service accounts** → Generate new private key → download JSON
2. Add to `backend/.env`:
   ```
   FIREBASE_PROJECT_ID=biblestudy-2b14c
   FIREBASE_CLIENT_EMAIL=<client_email from JSON>
   FIREBASE_PRIVATE_KEY="<private_key from JSON>"
   ```
3. Restart backend → push notifications live immediately
4. For iOS physical device: Firebase Console → Cloud Messaging → Apple app configuration → upload APNs `.p8` key (from developer.apple.com → Keys)

## Firebase project

- **Project ID**: `biblestudy-2b14c`
- **iOS bundle**: `com.biblestudypro.app` · GOOGLE_APP_ID `1:820831909172:ios:6f7e802808c95144ee2161`
- **Android package**: `com.biblestudypro.app`
- **GCM Sender ID**: `820831909172`

## Architecture

```
User action (friend request / achievement / etc.)
  → service calls sendPushToUser(userId, title, body, data)
      ├── prisma.notification.create()      ← in-app feed row
      └── FCM sendEachForMulticast(tokens)  ← push to all user devices
            └── stale token cleanup on 'registration-token-not-registered'
```

## Backend — `backend/src/utils/notifications.ts`

- `sendPushToUser(userId, title, body, data?)` — always creates in-app row; only sends FCM push if `FIREBASE_*` env vars are set (graceful no-op in dev without config).
- Firebase Admin SDK initialized lazily on first call.
- Stale/invalid tokens (`messaging/registration-token-not-registered`, `messaging/invalid-registration-token`) are auto-deleted after a failed send.

## Backend — `backend/src/modules/users/`

- `POST /users/device-token` — `{ token, platform: 'IOS'|'ANDROID' }` → upserts `DeviceToken` (unique on `token`).
- `POST /users/device-token/remove` — deletes token for this user.
- Both routes are `authMiddleware` protected.

## Frontend — `frontend/src/utils/notifications.ts`

- `registerDeviceToken()` — requests permission → gets FCM token → POST to backend. Safe to call multiple times (backend upserts).
- `removeDeviceToken()` — called on logout; removes token from backend.
- `onTokenRefresh()` — re-registers when FCM rotates the token. Returns unsubscribe fn.
- `setupForegroundHandler()` — shows a `react-native-toast-message` toast when a push arrives while the app is open (FCM suppresses foreground pushes by default).
- `handleNotificationNavigation(data, navigate)` — parses `data.type` and routes: `friend_request`/`friend_accepted` → ProfileTab → Friends; default → ProfileTab → Notifications.

## Frontend — `frontend/src/navigation/RootNavigator.tsx`

Wired in the auth effect:
- `registerDeviceToken()` on authenticated mount
- `onTokenRefresh()` subscription
- `setupForegroundHandler()` subscription
- `messaging().getInitialNotification()` — handles tap on notification that launched the app (killed state)
- `messaging().onNotificationOpenedApp()` — handles tap while app was backgrounded

## Data model

```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  Platform  // IOS | ANDROID
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

One row per physical device. `token @unique` means the same FCM token can't be double-registered. Cascade-deletes with User.

## Notification triggers (current)

| Event | Sender | sendPushToUser call |
|---|---|---|
| Friend request sent | `friends.service.sendFriendRequest` | receiver |
| Friend request accepted | `friends.service.respondToFriendRequest` | original sender |
| Achievement unlocked | `achievements.service.triggerAchievementCheck` | self |

## Related
[[Social]] · [[Gamification]] · [[Auth & Account]] · [[Architecture Overview]]
