---
tags: [architecture, frontend, navigation]
updated: 2026-08-08
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
├── Quiz              ← full-screen quiz runner (root-level, above the tabs)
├── QuizSummary       ← post-quiz review (root-level)
└── App → AppNavigator (bottom tabs)  ← 5 tabs
      HomeTab     → HomeScreen
      LibraryTab  → LibraryNavigator (stack)
                      Library → FolderDetail → SetDetail
                                             → CreateSet / EditSet
                                             → CreateCard / EditCard
                             → PublicSets
                             → FriendsSets
                             → StudyPlans → PlanDetail → CreatePlan   ← see [[Study Plans]]
      QuizTab     → QuizNavigator (stack)     ← see [[Quiz Feature]]
                      QuizHub → QuizDetail → QuizSetup
                      (the runner itself — Quiz / QuizSummary — is a root screen)
      AITab       → AINavigator (stack)
                      AIChat → ChatHistory
      ProfileTab  → ProfileNavigator (stack)  ← hosts social + monetization + gamification
                      Profile → EditProfile → ChangePassword → Credits → Paywall → Settings
                              → Achievements → Leaderboard        ← see [[Gamification]]
                              → Notes → NoteEditor
                              → Media → MediaPDFViewer
                              → Notifications
                              → Friends → FriendRequests / SearchUsers / UserProfile / BlockedUsers
                              → Groups → GroupDetail / CreateGroup / EditGroup / JoinGroup / PublicGroups
                                       → GroupPlanDetail → CreateGroupPlan   ← group study plans
```

> **Map / Gatherings is backend-only.** There is **no** `screens/map/` directory
> and **no** `MapNavigator` on the frontend — both were deleted (2026-08-06). The
> backend `map` + `gatherings` modules still exist, and a few unused
> `useMap`/`useGatherings` hooks remain, but nothing is reachable from the UI.
> There is also **no** StudyTab/MapTab and **no** standalone Study screen — the
> old Study feature was removed; studying now flows through **Study Plans**
> (LibraryTab) and **Quiz**.
>
> `CreateGroupPlan` reuses `CreatePlanScreen` (no separate file); both
> `CreatePlan` and `CreateGroupPlan` present modally.
> Verify against `frontend/src/navigation/*.tsx`.

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
  On `ProfileTab` this is enforced declaratively via `popToTopOnBlur: true` in
  `AppNavigator` — leaving Profile resets its (large) stack to the Profile root.
- **Verify-on-open:** `AppNavigator` calls `useSubscriptionSync()` on mount, so
  the store IAP entitlement is re-synced whenever the tab shell loads. See
  [[Credits & Subscriptions]].
- Auth state in `store/auth.store.ts` decides Auth vs App navigator at the root.

## See also
- [[Screen Map]] — every screen + its data hook
- [[Frontend Architecture]] — where navigation sits in the layer stack
