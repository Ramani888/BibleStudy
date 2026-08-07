---
tags: [frontend, screens]
---

# Screen Map

Every screen under `frontend/src/screens/`, grouped by domain, with its primary
data hook (see [[Hooks & API Layer]]). Navigator tree: [[Navigation]].

## auth/
- LoginScreen · RegisterScreen · VerifyEmailScreen · ForgotPasswordScreen ·
  ResetPasswordScreen → auth flow ([[Auth & Token Flow]])
- Shared `components/AuthLayout` — dark-mode aware (useTheme + makeStyles),
  SVG SparklesIcon logo, SafeAreaView + KeyboardAvoidingView + ScrollView shell.

## onboarding/
- OnboardingScreen → 3-slide intro (BookIcon / LibraryIcon / SparklesIcon SVGs),
  FlatList paging, dot indicators, Skip + Get Started CTAs. Dark-mode aware.

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

## quiz/  (see [[Quiz Feature v2 Plan]])
- QuizHubScreen → `useRecentQuizAttempts` (history list of recent attempts + "Start New Quiz" footer CTA)
- QuizSetupScreen → `useSets`, `useQuizSession` (set picker with search, mode chips, start CTA)
- QuizScreen → `useQuizSession` (full-screen, timer, header w/ exit+counter, 4px progress bar)
- QuizSummaryScreen → per-question review after completing a quiz
- QuizDetailScreen → `useQuiz` (score hero, mode/date chips, info card for a past attempt)
- components/: QuizItemView (renders one question — MC / type-answer / blanks / chunks / read),
  QuizResultScreen (`useQuizAttemptSave`)

## ai/
- AIChatScreen → `useAI` (chat, credits spent)
- ChatHistoryScreen → `useAI` sessions + bookmarks

## map/  ~~(gatherings)~~ — ❌ DELETED (2026-08-06)
Frontend screens (`screens/map/`) and `MapNavigator.tsx` removed. Backend `map` +
`gatherings` modules still exist. Resurrect from git history if needed.

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
- Study feature fully removed (front + back) — replaced by Quiz with 7 modes.
- The Profile stack is the largest — it carries friends, groups, notes, media,
  and notifications, not just account settings.
- Tab stacks reset to root on tab switch (commit `0f2c365`).
