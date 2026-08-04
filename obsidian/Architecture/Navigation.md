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
└── AppNavigator (bottom tabs)
      HomeTab     → HomeScreen
      LibraryTab  → LibraryNavigator (stack)
                      Library → FolderDetail → SetDetail
                                             → CreateSet / EditSet
                                             → CreateCard / EditCard
                             → PublicSets
                             → FriendsSets
      StudyTab    → StudyScreen
      AITab       → AINavigator (stack)
                      AIChat → ChatHistory
      MapTab      → MapNavigator (stack)
                      Map → GatheringDetail → CreateGathering / EditGathering
      ProfileTab  → ProfileNavigator (stack)  ← hosts the social layer
                      Profile → EditProfile → ChangePassword → Credits → Settings
                              → Notes → NoteEditor
                              → Media → MediaPDFViewer
                              → Notifications
                              → Friends → FriendRequests / SearchUsers / UserProfile / BlockedUsers
                              → Groups → GroupDetail / CreateGroup / EditGroup / JoinGroup / PublicGroups
```

> Note: the tab set is larger than CLAUDE.md documents — it adds a **Map** tab and
> the Profile stack carries the entire social feature set.

## Known behaviour

- **Tab stacks reset to root when switching tabs** (fix commit `0f2c365`).
- Auth state in `store/auth.store.ts` decides Auth vs App navigator at the root.

## See also
- [[Screen Map]] — every screen + its data hook
- [[Frontend Architecture]] — where navigation sits in the layer stack
