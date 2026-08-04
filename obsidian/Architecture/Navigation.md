---
tags: [architecture, frontend, navigation]
---

# Navigation

React Navigation v7 (native-stack + bottom-tabs). Defined in
`frontend/src/navigation/`; params typed in `navigation/types.ts` (update there
**first**, then the screen).

## Tree

```
RootNavigator                         ← gated by auth.store (see [[Auth & Token Flow]])
├── AuthNavigator (stack)
│     Login → Register → VerifyEmail → ForgotPassword → ResetPassword
│     (Onboarding shown for first-run)
└── AppNavigator (bottom tabs)  ← exactly 4 tabs
      HomeTab     → HomeScreen
      LibraryTab  → LibraryNavigator (stack)
                      Library → FolderDetail → SetDetail
                                             → CreateSet / EditSet
                                             → CreateCard / EditCard
                             → PublicSets
                             → FriendsSets
                             → Study          ← StudyScreen lives inside LibraryTab
      AITab       → AINavigator (stack)
                      AIChat → ChatHistory
      ProfileTab  → ProfileNavigator (stack)  ← hosts the social layer
                      Profile → EditProfile → ChangePassword → Credits → Settings
                              → Notes → NoteEditor
                              → Media → MediaPDFViewer
                              → Notifications
                              → Friends → FriendRequests / SearchUsers / UserProfile / BlockedUsers
                              → Groups → GroupDetail / CreateGroup / EditGroup / JoinGroup / PublicGroups
```

> ⚠️ `MapNavigator` and the `map/` screens (Map, Gatherings) exist in code but are
> **not mounted** anywhere — the Map feature is currently unreachable. There is
> **no** StudyTab/MapTab; Study is a stack screen under LibraryTab.

## Safe-area convention

All stack navigators use `headerShown: false` + a custom in-screen header, so
every tab-hosted screen wraps content in `<SafeAreaView edges={['top']}>` — **top
only**. The bottom tab bar owns the bottom inset: `AppNavigator` sets
`height: tabBarHeight + insets.bottom` via `useSafeAreaInsets()`. Using
`edges={['bottom']}` / all-edges on a tab-hosted screen double-counts the bottom
inset and leaves an empty gap above the tab bar (fixed 2026-08-04 — it had been
masked on Home by the since-removed AdBanner). Screens outside the tabs (auth,
onboarding) manage their own insets.

## Known behaviour

- **Tab stacks reset to root when switching tabs** (fix commit `0f2c365`).
- Auth state in `store/auth.store.ts` decides Auth vs App navigator at the root.

## See also
- [[Screen Map]] — every screen + its data hook
- [[Frontend Architecture]] — where navigation sits in the layer stack
