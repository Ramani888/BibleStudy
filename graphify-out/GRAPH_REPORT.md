# Graph Report - BibleStudy  (2026-04-29)

## Corpus Check
- 211 files · ~56,512 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 590 nodes · 635 edges · 15 communities detected
- Extraction: 62% EXTRACTED · 38% INFERRED · 0% AMBIGUOUS · INFERRED: 242 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 28|Community 28]]

## God Nodes (most connected - your core abstractions)
1. `sendError()` - 87 edges
2. `sendSuccess()` - 86 edges
3. `logActivity()` - 8 edges
4. `AppDelegate` - 8 edges
5. `LibraryScreen()` - 7 edges
6. `SetDetailScreen()` - 7 edges
7. `register()` - 5 edges
8. `verifyEmail()` - 5 edges
9. `verifySetOwnership()` - 5 edges
10. `sendPushToUser()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `authMiddleware()` --calls--> `sendError()`  [INFERRED]
  backend\src\middlewares\auth.middleware.ts → backend\src\utils\response.ts
- `getMe()` --calls--> `sendSuccess()`  [INFERRED]
  backend\src\modules\auth\auth.controller.ts → backend\src\utils\response.ts
- `getMe()` --calls--> `sendError()`  [INFERRED]
  backend\src\modules\auth\auth.controller.ts → backend\src\utils\response.ts
- `register()` --calls--> `onSubmit()`  [INFERRED]
  backend\src\modules\auth\auth.service.ts → frontend\src\screens\auth\RegisterScreen.tsx
- `recordStudyResult()` --calls--> `logActivity()`  [INFERRED]
  backend\src\modules\cards\cards.service.ts → backend\src\utils\activity.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (86): getFriendsFeed(), getMyFeed(), askQuestion(), getChatHistory(), getDailyVerse(), forgotPassword(), login(), logout() (+78 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (13): acceptRequest(), sendRequest(), createGathering(), getGathering(), getNearby(), listParticipants(), rsvp(), createGroup() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (13): useCreateFolder(), useDeleteFolder(), useFolders(), useCloneSet(), useCreateSet(), useDeleteSet(), useSet(), useSets() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (19): forgotPassword(), login(), parseDuration(), refreshToken(), register(), resendVerification(), resetPassword(), verifyEmail() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (8): apiPost(), getErrorMessage(), getMe(), onSubmit(), handleSave(), onSubmit(), getProfile(), updateProfile()

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (11): AppDelegate, ReactNativeDelegate, MessagingDelegate, RCTDefaultReactNativeFactoryDelegate, UIApplicationDelegate, UIResponder, UNUserNotificationCenterDelegate, onTokenRefresh() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (11): bulkCreateCards(), calculateNextReviewAt(), createCard(), listCardsBySet(), moveCard(), recordStudyResult(), updateCard(), verifySetOwnership() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (4): useCreateGroup(), useJoinGroup(), CreateGroupScreen(), JoinGroupScreen()

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (6): useBlockedUsers(), useSearchUsers(), useSendFriendRequest(), useUnblockUser(), BlockedUsersScreen(), SearchUsersScreen()

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (6): useCards(), useCopyCard(), useDeleteCard(), useMoveCard(), useUpdateCard(), SetDetailScreen()

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (2): DailyLoginButton(), useClaimDailyLogin()

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (2): useDeleteAccount(), SettingsScreen()

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (2): connectDB(), startServer()

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (1): MainActivity

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (1): MainApplication

## Knowledge Gaps
- **Thin community `Community 11`** (10 nodes): `useCredits.ts`, `HomeScreen.tsx`, `ActivityItem()`, `activityLabel()`, `DailyLoginButton()`, `greeting()`, `QuickActionGrid()`, `useClaimDailyLogin()`, `useCreditBalance()`, `useCreditTransactions()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (6 nodes): `useProfile.ts`, `SettingsScreen.tsx`, `useChangePassword()`, `useDeleteAccount()`, `useUpdateProfile()`, `SettingsScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (5 nodes): `db.ts`, `server.ts`, `connectDB()`, `disconnectDB()`, `startServer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (4 nodes): `MainActivity.kt`, `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (3 nodes): `MainApplication.kt`, `MainApplication`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getErrorMessage()` connect `Community 4` to `Community 6`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `logActivity()` connect `Community 1` to `Community 2`, `Community 6`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 86 inferred relationships involving `sendError()` (e.g. with `authMiddleware()` and `getMyFeed()`) actually correct?**
  _`sendError()` has 86 INFERRED edges - model-reasoned connections that need verification._
- **Are the 85 inferred relationships involving `sendSuccess()` (e.g. with `getMyFeed()` and `getFriendsFeed()`) actually correct?**
  _`sendSuccess()` has 85 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `logActivity()` (e.g. with `recordStudyResult()` and `acceptRequest()`) actually correct?**
  _`logActivity()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `LibraryScreen()` (e.g. with `useFolders()` and `useSets()`) actually correct?**
  _`LibraryScreen()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._