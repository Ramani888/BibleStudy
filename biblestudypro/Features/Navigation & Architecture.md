---
title: Navigation & Architecture
tags: [navigation, architecture]
updated: 2026-08-14
---

# Navigation & Architecture

> How the app is wired together: the full navigator tree, tab state management, cross-tab navigation patterns, Android status/nav-bar sync, and safe-area rules.

## Navigator tree

```
RootStack (NativeStack, headerShown:false)
  └─ App          → AppNavigator (bottom tabs)
      ├─ HomeTab          — HomeScreen (tab leaf, no inner stack)
      ├─ LibraryTab       — LibraryNavigator (NativeStack)
      │     Library, FolderDetail, SetDetail, CreateSet(modal), EditSet(modal),
      │     CreateCard(modal), EditCard(modal), PublicSets, FriendsSets,
      │     StudyPlans, PlanDetail, CreatePlan(modal)
      ├─ QuizTab          — QuizNavigator (NativeStack)
      │     QuizHub, QuizDetail, QuizSetup, Quiz
      ├─ AITab            — AINavigator (NativeStack)
      │     AIChat, ChatHistory
      └─ ProfileTab       — ProfileNavigator (NativeStack)
            Profile, EditProfile, ChangePassword, Settings, NotificationSettings,
            AboutUs, PrivacyPolicy, Credits, Paywall, Achievements,
            Friends, Leaderboard, FriendRequests, SearchUsers, UserProfile, BlockedUsers,
            Notifications, Notes, NoteEditor, Media, MediaPDFViewer
  Quiz        (root-stack screen, full-screen, no tab bar)
  QuizSummary (root-stack screen, full-screen, no tab bar)
```

`RootNavigator` → chooses `AuthNavigator` (Login/Register/…) or the `App` route when authenticated.

Files:
- `frontend/src/navigation/RootNavigator.tsx`
- `frontend/src/navigation/AppNavigator.tsx`
- `frontend/src/navigation/LibraryNavigator.tsx` · `QuizNavigator.tsx` · `AINavigator.tsx` · `ProfileNavigator.tsx`
- `frontend/src/navigation/AuthNavigator.tsx`
- `frontend/src/navigation/types.ts` — all `ParamList` types + convenience `ScreenProps` types

## Tab reset behavior (state-bleed prevention)

HomeTab is a leaf — navigating cross-tab from Home pushes a screen onto the target tab's stack. Without guards, switching back to that tab later would show the deep screen instead of the root.

Three mechanisms, one per tab:

| Tab | Mechanism | Effect |
|-----|-----------|--------|
| **ProfileTab** | `popToTopOnBlur: true` (AppNavigator option) | Resets to Profile root whenever the tab loses focus |
| **LibraryTab** | `blur` event listener in `LibraryNavigator` (`CommonActions.reset`) | On tab blur, if stack index > 0, dispatches a reset to `{ routes: [{ name: 'Library' }] }` targeting the stack's key |
| **QuizTab** | `blur` event listener in `QuizNavigator` | Same pattern — resets to `QuizHub` on tab switch (not on root-overlay blur like Quiz/QuizSummary) |
| AITab | No reset guard | AIChat is almost always the only screen; session persists in Zustand |

> **Root-overlay guard (Library + Quiz blur listeners):** the listener checks that the blur is from a real tab switch (not from a full-screen overlay like `Quiz`/`QuizSummary` mounting above `App`). If `selectedRoute.name === 'LibraryTab'` / `'QuizTab'` the reset is skipped.

## Cross-tab navigation from Home — `initial: false`

`HomeTab` has no inner stack, so navigating to another tab's sub-screen uses the tab navigator's `navigate`. **React Navigation defaults `initial: true`**, which would make the deep screen the *only* route in the target stack (no parent underneath), breaking the back stack.

All non-root cross-tab navigations in `useHomeNavigation.ts` pass **`initial: false`** to ensure the target navigator's initial route (Library, Profile, QuizHub) is inserted first:

```ts
// ✅ correct — stack becomes [Library, SetDetail]
navigation.navigate('LibraryTab', {
  screen: 'SetDetail',
  params: { setId, setTitle },
  initial: false,
})

// ❌ wrong (old) — stack becomes [SetDetail] only; back pops to HomeTab
navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId, setTitle } })
```

Root screens (Library, AIChat, Profile, QuizHub) don't need `initial: false` — they are the initial route.

Commit: `035fb45` (2026-08-14).

## Tab icons (active / inactive state)

`AppNavigator` passes `filled={focused}` to every `TabIcon` component:

```ts
tabBarIcon: ({ color, size, focused }) => {
  const TabIcon = TAB_ICONS[route.name];
  return <TabIcon size={size ?? 24} color={color} filled={focused} />;
}
```

- **Active** (`focused=true`): filled icon variant + `colors.accent` (indigo).
- **Inactive** (`focused=false`): outline icon + `colors.tabInactive`.

`tabBarInactiveTintColor: colors.tabInactive` is set globally; active tint is `colors.accent`. Commit: `e3214ed` (2026-08-14).

## System bar sync (`useSystemBars`)

Hook: `frontend/src/hooks/useSystemBars.ts`. Android-only (no-op on iOS). Sets the Android bottom navigation bar color via `react-native-system-navigation-bar`. Called from every navigator/screen that owns its own background:

| Caller | Color arg |
|--------|-----------|
| `AppNavigator` | `colors.bottomBar` (tab bar background) |
| `AuthNavigator` | `colors.background` |
| `RootNavigator` | `colors.background` |
| `SplashScreen` | `BRAND_BG` (brand indigo, hardcoded) |
| `OnboardingScreen` | `colors.background` |

Reactive: re-runs on `barColor` or `isDark` change → dark-mode toggle syncs instantly.
Global `<StatusBar>` is mounted in `App.tsx` with `translucent` and theme-aware `barStyle`.

Commits: `5249c4b` (initial), `2305406` (per-context colors, 2026-08-14).

## Safe-area rules

All navigators use `headerShown: false` — screens own their own headers.

| Screen context | `SafeAreaView` edges |
|----------------|----------------------|
| Tab-hosted screens (most) | `edges={['top']}` — tab bar owns bottom inset |
| Modal screens (`presentation: 'modal'`) | Default `['top','bottom']` or omit edges |
| Root-stack screens (Quiz, QuizSummary) | Default (no edge override) |
| Auth/Onboarding screens | `edges={['top','bottom']}` or full safe area |

**Never use `edges={['bottom']}` or all-edges on a tab-hosted screen** — the tab bar fills the bottom inset and double-padding will result.

Library Create/Edit screens (`CreateCard`, `CreateSet`, `EditCard`, `EditSet`, `CreatePlan`) are modals — they include bottom safe area explicitly. `CreatePlanScreen` has a keyboard-avoiding wrapper to prevent the input field gap on iOS. Commit: `a1f4ca8` (2026-08-14).

## Screen count

~49 screens total (2026-08-14):
- Auth: Login, Register, VerifyEmail, ForgotPassword, ResetPassword (5)
- Onboarding: OnboardingScreen (1)
- Home: HomeScreen (1)
- Library: Library, FolderDetail, SetDetail, CreateSet, EditSet, CreateCard, EditCard, PublicSets, FriendsSets, StudyPlans, PlanDetail, CreatePlan (12)
- Quiz: QuizHub, QuizDetail, QuizSetup, QuizScreen, QuizSummary (5)
- AI: AIChat, ChatHistory (2)
- Profile: Profile, EditProfile, ChangePassword, Settings, NotificationSettings, AboutUs, PrivacyPolicy, Credits, Paywall, Achievements, Friends, Leaderboard, FriendRequests, SearchUsers, UserProfile, BlockedUsers, Notifications, Notes, NoteEditor, Media, MediaPDFViewer, MediaImageViewer (22)
- Splash: SplashScreen (1)

## Navigation types & convenience props

`frontend/src/navigation/types.ts` exports `ParamList` types for every stack + tab, and convenience `ScreenProps` aliases using `CompositeScreenProps` so screens type-check cross-tab navigation calls:

```ts
export type LibraryScreenProps<T extends keyof LibraryStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<LibraryStackParamList, T>,
    BottomTabScreenProps<AppTabParamList>
  >;
```

`HomeTab` uses a raw `BottomTabNavigationProp<AppTabParamList>` since it has no inner stack.

## Related
[[Home Dashboard]] · [[Study Core]] · [[Auth & Account]] · [[AI Chat]] · [[Quiz]]
