---
title: Crash Reporting
tags: [feature, crash-reporting, firebase]
updated: 2026-10-15
---

# Crash Reporting

> Firebase Crashlytics tells us when, where and for whom the app crashes in real users' hands, and a friendly retry screen replaces the blank screen a render crash used to leave.

## Screens
No route of its own. `CrashBoundary` wraps `RootNavigator` in `App.tsx`, so any screen that throws while rendering shows the fallback.

| Piece | File | Purpose |
|-------|------|---------|
| Crash helper | `frontend/src/lib/crashlytics.ts` | enable/disable, user link, breadcrumbs, `recordError()` |
| Error boundary | `frontend/src/components/feedback/CrashBoundary.tsx` | catches render crashes, reports them, shows retry screen |
| Native config | `frontend/firebase.json` | auto-collection OFF at install; JS crashes become fatal reports |

## Features & functionality
- **Native + JS crashes** reported to Firebase project `verdance-bb5c2` (Crashlytics tab).
- **Render crashes** caught by `CrashBoundary`: shows `ErrorState` ("Oops!" + `common:status.crashed` + Try again). Try again re-mounts the navigator tree. The error and component stack go to Crashlytics as a non-fatal.
- **Screen trail**: `RootNavigator` `onReady`/`onStateChange` logs `screen: <RouteName>` breadcrumbs, so a report shows the path to the crash.
- **User link**: backend user id only (no email/name), set on login and cleared on logout in `App.tsx` alongside PostHog `identify`.
- **`recordError(error, context)`** for errors we catch ourselves.

## Data flow
`App start → analytics.store.hydrate() → setCrashReportingEnabled(enabled)` → Crashlytics collection flag (persisted natively).
`Settings analytics toggle → analytics.store.setEnabled() → setCrashReportingEnabled()`.
`auth user id → App.tsx effect → setCrashUser()`.

## Edge cases, rules & gotchas
- **Off in dev**: collection is only enabled when `!__DEV__`, so Metro/debug crashes never reach the dashboard. Test with a **release** build.
- **Opt-out**: the single Settings analytics switch covers crash reports too (LGPD). The flag persists natively, so after the first launch an opted-in user is covered from cold start; an opted-out user sends nothing.
- **Very first launch**: crashes before `hydrate()` runs on the first ever launch are not sent (auto-collection is off until JS enables it). Accepted trade-off for honoring opt-out.
- **iOS symbols**: the `[RNFB] Crashlytics Configuration` build phase (added by autolinking on `pod install`) uploads dSYMs. Release already uses `dwarf-with-dsym`.
- **Android**: `com.google.firebase.crashlytics` Gradle plugin 3.0.6 (version from `@react-native-firebase/app` sdkVersions). ProGuard is off, so no mapping upload is needed; no NDK crash reporting.
- **Versions**: `@react-native-firebase/crashlytics` pinned to **24.0.0** to match `app`/`messaging`. Upgrade all RNFB packages together.
- `CrashBoundary` is the one **class component** in the app: React only supports error boundaries as classes.

## Store / privacy
- App Store Connect, App Privacy: add **Crash Data** (linked to user, app functionality, not used for tracking).
- Play Console, Data safety: add **App info and performance → Crash logs + Diagnostics** (collected, not shared).
- Needs a new native build for both stores.

## Related
[[Navigation & Architecture]] · [[Push Notifications]] · [[Auth & Account]]
