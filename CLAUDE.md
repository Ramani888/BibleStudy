<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

## Project: BibleStudyPro

A Bible study flashcard app with AI assistant features.

### Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL |
| Frontend | React Native CLI 0.84 (NO Expo), TypeScript, React 19 |
| State | Zustand (auth), React Query v5 (server state) |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| Forms | react-hook-form + zod |
| HTTP | axios with token-refresh interceptor (`frontend/src/api/client.ts`) |
| UI | Custom component library (`frontend/src/components/`) |

### Backend Base URL

`/api/v1` — 15 modules: `auth`, `users`, `folders`, `sets`, `cards`, `ai`,
`credits`, `friends`, `groups`, `gatherings`, `map`, `activities`,
`notifications`, `notes`, `media`.

Each module under `backend/src/modules/<feature>/` has the same 4 files:
`<f>.routes.ts` · `<f>.controller.ts` · `<f>.service.ts` (owns all Prisma) ·
`<f>.dto.ts` (zod). Beyond the study core (folders/sets/cards/ai/credits) there
is a full **social layer**: friends, groups, in-person gatherings on a map,
an activity feed, and notifications.

---

## Frontend Architecture

### Directory Map

```
frontend/src/
  api/          # axios client + per-module API functions
  components/
    ui/         # Button, Card, Input, Typography, Avatar, Badge, Divider, ProgressBar, Spacer
    feedback/   # Modal, ActionSheet, EmptyState, ErrorState, LoadingOverlay, SkeletonLoader
    forms/      # FormField, OTPInput
    domain/     # ChatBubble, CreditBadge, DailyVerseCard, DifficultyBadge, FlashCard, FolderCard, SetCard
  hooks/        # useAI, useCards, useCredits, useDailyVerse, useFolders, useSets, useNotes,
                #   useMedia, useFriends, useGroups, useGatherings, useMap, useActivities,
                #   useNotifications, useProfile, useUser, useStudySession, ... (23 hooks)
  navigation/   # RootNavigator → AuthNavigator | AppNavigator (tabs)
  screens/
    auth/       # Login, Register, VerifyEmail, ForgotPassword, ResetPassword
    onboarding/ # OnboardingScreen
    home/       # HomeScreen
    library/    # LibraryScreen, FolderDetail, SetDetail, CreateSet, EditSet, CreateCard, EditCard, PublicSets, FriendsSets
    ai/         # AIChatScreen, ChatHistoryScreen
    study/      # StudyScreen
    map/        # MapScreen, GatheringDetail, CreateGathering, EditGathering
    profile/    # ProfileScreen, EditProfile, ChangePassword, Credits, Settings + social:
                #   Notes/NoteEditor, Media/MediaPDFViewer, Notifications,
                #   Friends/FriendRequests/SearchUsers/UserProfile/BlockedUsers,
                #   Groups/GroupDetail/CreateGroup/EditGroup/JoinGroup/PublicGroups
  store/        # auth.store.ts (Zustand)
  theme/        # colors, spacing, typography, shadows
  types/        # per-domain TypeScript types
  utils/        # formatters, storage, validators
```

### Navigation Structure

```
RootNavigator
  AuthNavigator (stack)
    Login → Register → VerifyEmail → ForgotPassword → ResetPassword
  AppNavigator (bottom tabs)   # exactly 4 tabs
    HomeTab        → HomeScreen
    LibraryTab     → LibraryNavigator (stack)
                       Library → FolderDetail → SetDetail
                                              → CreateSet / EditSet
                                              → CreateCard / EditCard
                              → PublicSets / FriendsSets
                              → Study            # study lives INSIDE LibraryTab
    AITab          → AINavigator (stack)
                       AIChat → ChatHistory
    ProfileTab     → ProfileNavigator (stack)   # hosts the social layer
                       Profile → EditProfile → ChangePassword → Credits → Settings
                               → Notes → NoteEditor
                               → Media → MediaPDFViewer
                               → Notifications
                               → Friends → FriendRequests / SearchUsers / UserProfile / BlockedUsers
                               → Groups → GroupDetail / CreateGroup / EditGroup / JoinGroup / PublicGroups
```

> **Note:** `MapNavigator` + the `map/` screens (Map, Gatherings) exist in the
> code but are **not mounted** in any navigator yet — the Map feature is
> currently unreachable.

**Safe-area convention:** all stack navigators use `headerShown: false` with a
custom in-screen header. Tab-hosted screens therefore wrap content in
`<SafeAreaView edges={['top']}>` — **top only**; the bottom tab bar owns the
bottom inset (it adds `insets.bottom` to its height in `AppNavigator`). Do **not**
use `edges={['bottom']}` / all-edges on a tab-hosted screen — it double-counts the
bottom inset and leaves a gap above the tab bar. Screens outside the tabs (auth,
onboarding) manage their own insets.

> Full architecture is documented in the Obsidian brain at `obsidian/` (open
> `obsidian/Home.md`) — kept in sync with this file.

---

## Coding Conventions

### Components

- Functional components only, named exports (no default exports from screens).
- Co-locate screen-specific sub-components in `screens/<domain>/components/`.
- Use `StyleSheet.create` at the bottom of each file, named `styles`.
- Import order: React → RN core → 3rd-party → internal (`../../components`, `../../hooks`, etc.).
- Type screen props with the convenience types from `navigation/types.ts` (e.g. `LibraryScreenProps<'Library'>`).

### Hooks

- Each hook lives in `hooks/use<Feature>.ts` and uses React Query.
- Query keys are string arrays: `['sets']`, `['sets', setId]`, `['cards', setId]`.
- Mutations invalidate the relevant query key on `onSuccess`.
- Never put API calls directly in screen components — always go through a hook.

### API Layer

- Each module has `<module>.api.ts` with typed functions.
- All API functions import from `./client` (the axios instance with auth interceptors).
- Return raw response data, let React Query handle caching/loading states.

### TypeScript

- Strict mode is on. No `any` unless absolutely required (add a comment explaining why).
- Use types from `src/types/<domain>.types.ts`; extend there if new fields are needed.
- Navigation params are defined in `navigation/types.ts` — update there first, then the screen.

### Theme

- Never hardcode colors — always use `colors.*` from `theme/colors.ts`.
- Spacing uses the `spacing` scale object — e.g. `spacing[4]`, not `16`.
- Typography uses `<Typography preset="...">` — never raw `<Text>` in screens.

---

## Agent & Skill Usage Guide

### When to use which skill

| Task | Use |
|------|-----|
| Build a new screen or component | `/feature-dev` |
| Review code for bugs before committing | `/code-review` |
| Clean up messy code after implementation | `/simplify` |
| UI styling pass for polish | `/frontend-design` (note: web-focused, adapt to RN) |
| Create a new MCP tool | `/mcp-builder` (via `claude skill install`) |
| Write Claude API integration | `/claude-api` |

### Subagent roles

When delegating to subagents, assign roles clearly:

- **`feature-dev:code-architect`** — design the screen's data flow, props, and hook dependencies before writing code
- **`feature-dev:code-explorer`** — trace how an existing screen/hook works before modifying it
- **`feature-dev:code-reviewer`** — catch bugs and logic errors after implementing a screen
- **`Explore`** — fast codebase search when you know the keyword but not the file

### Safe development workflow

1. Use `semantic_search_nodes` or `query_graph` to understand existing code before touching it.
2. Plan with `feature-dev:code-architect` for any screen that has > 2 dependent hooks.
3. After implementing, run `/simplify` to clean up any accidental complexity.
4. After simplify, run `/code-review` to catch bugs.
5. TypeScript errors are shown automatically after every file save (via PostToolUse hook).

---

## Common Commands

```bash
# Frontend
cd frontend && npx react-native start          # Metro bundler
cd frontend && npx react-native run-ios        # iOS simulator
cd frontend && npx react-native run-android    # Android emulator
cd frontend && npx tsc --noEmit               # Type check
cd frontend && npm run lint                   # ESLint

# Backend
cd backend && npm run dev                     # Dev server (ts-node-dev)
cd backend && npx prisma studio               # DB GUI
cd backend && npx prisma migrate dev          # Run migrations
```

---

## Safety Rules

- **Never** force-push (`git push --force`) — blocked by settings.
- **Never** run `prisma migrate reset` in production — blocked by settings.
- **Never** hardcode API keys or tokens — use `react-native-config` (`.env`).
- Before deleting any file, check `get_impact_radius` on it first.
- Do not change `frontend/src/api/client.ts` token-refresh logic without a full review.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
