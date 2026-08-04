---
tags: [frontend, screens]
---

# Screen Map

Every screen under `frontend/src/screens/`, grouped by domain, with its primary
data hook (see [[Hooks & API Layer]]). Navigator tree: [[Navigation]].

## auth/
- LoginScreen · RegisterScreen · VerifyEmailScreen · ForgotPasswordScreen ·
  ResetPasswordScreen → auth flow ([[Auth & Token Flow]])

## onboarding/
- OnboardingScreen → first-run intro

## home/
- HomeScreen → `useDailyVerse`, `useAutoDailyClaim`, credit summary

## library/  (study core)
- LibraryScreen → `useFolders` / `useSets`
- FolderDetailScreen → `useFolders`, `useSets`
- SetDetailScreen → `useSets`, `useCards`
- CreateSetScreen / EditSetScreen → `useSets`
- CreateCardScreen / EditCardScreen → `useCards`
- PublicSetsScreen → public/shared sets
- FriendsSetsScreen → sets shared by friends (`useFriends` + `useSets`)

## study/
- StudyScreen → `useStudySession`, `useCards`

## ai/
- AIChatScreen → `useAI` (chat, credits spent)
- ChatHistoryScreen → `useAI` sessions + bookmarks

## map/  (gatherings) — ⚠️ NOT mounted / currently unreachable (MapNavigator isn't rendered)
- MapScreen → `useMap`, `useGatherings`
- GatheringDetailScreen → `useGatherings`
- CreateGatheringScreen / EditGatheringScreen → `useGatherings`

## profile/  (also hosts the social layer)
- ProfileScreen · EditProfileScreen · ChangePasswordScreen · SettingsScreen → `useProfile` / `useUser`
- CreditsScreen → `useCredits`
- NotesScreen / NoteEditorScreen → `useNotes`
- MediaScreen / MediaPDFViewerScreen → `useMedia`
- NotificationsScreen → `useNotifications`
- **Friends:** FriendsScreen · FriendRequestsScreen · SearchUsersScreen ·
  UserProfileScreen · BlockedUsersScreen → `useFriends`
- **Groups:** GroupsScreen · GroupDetailScreen · CreateGroupScreen ·
  EditGroupScreen · JoinGroupScreen · PublicGroupsScreen → `useGroups`

## Notes
- The Profile stack is the largest — it carries friends, groups, notes, media,
  and notifications, not just account settings.
- Tab stacks reset to root on tab switch (commit `0f2c365`).
