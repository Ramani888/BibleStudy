# BibleStudyPro — Project Rules

AI-assisted Bible-study flashcard app. Full-stack: **Node/Express/Prisma/PostgreSQL**
backend + **React Native 0.84 / React 19** app (NO Expo). Full feature docs live in the
Obsidian vault at `biblestudypro/` — open `biblestudypro/Home.md` (MOC) → `biblestudypro/Features/`.

## Exploration tooling (use BEFORE Grep/Glob/Read)
This repo has two knowledge graphs — prefer them for exploration; they're cheaper and give structure.
- **code-review-graph MCP**: `semantic_search_nodes`/`query_graph` (callers/callees/imports/tests),
  `get_impact_radius` (blast radius), `detect_changes`+`get_review_context` (review), `get_affected_flows`.
- **graphify** (`graphify-out/`): read `graphify-out/GRAPH_REPORT.md` for architecture questions;
  use `graphify query/path/explain` for cross-module "how does X relate to Y"; run `graphify update .`
  after code changes (AST-only, no API cost). Fall back to Grep/Read only when the graph lacks it.

## Stack
| Layer | Tech |
|-------|------|
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL |
| Frontend | React Native CLI 0.84 (NO Expo), TypeScript, React 19 |
| State | Zustand (auth + AI chat session), React Query v5 (server state) |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| Forms | react-hook-form + zod |
| HTTP | axios w/ token-refresh interceptor (`frontend/src/api/client.ts`) |
| AI | OpenRouter (free text) ↔ Claude (media + fallback), env-switched |
| IAP | react-native-iap v16 (+ react-native-nitro-modules) |

## Backend
Base URL `/api/v1`. **16 modules**, each `backend/src/modules/<m>/` with the same 4 files:
`<m>.routes.ts` · `<m>.controller.ts` · `<m>.service.ts` (owns ALL Prisma) · `<m>.dto.ts` (zod):
`auth`, `users`, `folders`, `sets`, `cards`, `ai`, `credits`, `friends`, `activities`,
`notifications`, `notes`, `media`, `quiz`, `achievements`, `plans`, `subscriptions`.

- Prisma access lives ONLY in `*.service.ts` — controllers/routes never call Prisma directly.
- Every new module must be mounted in `backend/src/app.ts` and get a migration via `prisma migrate dev`.
- Achievements are **code-defined** in `achievements.defs.ts` (no catalogue table); only unlocks persist
  (`UserAchievement`). Add a def there + a metric in `computeMetrics`, never a DB row.

## Frontend
```
frontend/src/
  api/         # axios client + per-module <module>.api.ts (typed fns, return raw data)
  components/  # ui/ feedback/ forms/ domain/  (custom lib — no 3rd-party UI kit)
  hooks/       # use<Feature>.ts — React Query wrappers (one per module + usePickMedia, useSubscription…)
  navigation/  # RootNavigator → AuthNavigator | AppNavigator (5 tabs)
  screens/     # auth/ onboarding/ home/ library/ ai/ profile/ quiz/  (~49 screens)
  store/       # auth.store.ts, aiChat.store.ts (Zustand)
  theme/ types/ utils/
```
Tabs: **Home**, **Library** (sets/cards/study/quiz + study plans), **Quiz**, **AI**, **Profile**
(hosts social + credits/subscriptions + gamification). Studying/review = **Quiz** (`SetDetail` is a card
manager; there is **no** StudyScreen and `FlashCard.tsx` is dead code). Group plan detail + Paywall + Leaderboard + Achievements live
under the Profile stack.

**Safe-area:** stack navigators use `headerShown:false` + custom in-screen header. Tab-hosted screens
wrap content in `<SafeAreaView edges={['top']}>` (top only — the tab bar owns the bottom inset). Never
use `edges={['bottom']}`/all-edges on a tab-hosted screen.

**Cross-tab nav:** navigate to another tab's screen with `navigation.navigate('ProfileTab', { screen: 'Paywall' })`
— convenience prop types are `CompositeScreenProps` so this type-checks. `ProfileTab` has
`popToTopOnBlur:true`, so it always reopens at the Profile root.

## Coding conventions (all falsifiable)
- Functional components only; **named exports** from screens (no default exports).
- `StyleSheet.create` at file bottom, named `styles` (or `makeStyles(theme)` when theme-dependent).
- Import order: React → RN core → 3rd-party → internal.
- Screen props typed via `navigation/types.ts` convenience types (e.g. `LibraryScreenProps<'Library'>`).
- Add a nav route to `navigation/types.ts` FIRST, then register in the navigator, then the screen.
- Hooks: `hooks/use<Feature>.ts`, React Query. Query keys are string arrays (`['sets', setId]`).
  Mutations `invalidateQueries` the affected keys in `onSuccess`. NEVER call the api layer from a screen —
  always via a hook.
- API: `<module>.api.ts` imports from `./client`, returns raw response data.
- TS strict is on. No `any` without an inline comment justifying it. Types in `src/types/<domain>.types.ts`.
- Theme: never hardcode colors/spacing/text — use `colors.*`, `spacing[n]`, `<Typography preset="…">`.
  No raw `<Text>` in screens. No magic numbers for style values.

## Process rules
- **Commit per feature as it lands** (don't let work pile up — the A–G arc became one giant commit `621bfdd`
  because this rule didn't exist yet).
- **Type-check both ends before every commit**: `cd backend && npx tsc --noEmit` AND `cd frontend && npx tsc --noEmit`.
- **Verify money/DB/permission logic with a runnable check** before claiming done — a throwaway ts-node
  script against the dev DB (run inside `backend/` with `--compiler-options '{"module":"commonjs","moduleResolution":"node"}'`),
  asserting the outcome (e.g. "no credit charged on reject"). Delete the script after.
- **After a feature/phase lands**, update `APP_SCOPE.md`, the relevant `biblestudypro/Features/` note, and memory.
- **Backend restart required** after `.env` or `schema.prisma` changes (ts-node-dev won't pick them up live).
- **Physical-device API base URL** must be the Mac's LAN IP (react-native-config `.env`), not `localhost`.

## Do NOT touch without a full review
- `frontend/src/api/client.ts` token-refresh/queue logic.
- `backend/src/modules/ai/ai.service.ts` `generateAnswer` provider seam (media MUST force Claude + pin `CLAUDE_MODEL`).
- `backend/src/modules/subscriptions/` receipt-verification + idempotent grant.
- `backend/src/config/plans.ts` — single source of truth for tiers/prices/product IDs; product IDs must
  match App Store Connect AND `frontend/src/types/subscription.types.ts`.
- Never force-push; never `prisma migrate reset` on a real DB; never hardcode keys (use `.env`).
- Before deleting any file, check `get_impact_radius` on it first.

## Known gaps & gotchas (facts, keep current)
- **Spaced repetition is LIVE (SM-2)**: driven by the quiz flow — `quiz.service` feeds each attempt's scored
  responses into `cards.service.applyReviews` (correct→q5, wrong→q2), which writes `Card.interval`/`ease`/
  `nextReviewAt`/`lastStudiedAt`. `getDueSummary` reads it, so Home's "due" count works. Ceilings: cards that
  were never quizzed have `nextReviewAt=null` (not counted as due); a wrong card reschedules +1 day (no sub-day
  learning steps yet). `FlashCard.tsx` is dead code — review happens in Quiz, not a flip screen.
- **Map + Gatherings + Groups**: not implemented — no backend modules, no frontend hooks, no screens, no nav routes. Deferred to post-launch.
- **Media chat needs a funded Anthropic account** (media routes to paid Claude); errors cleanly, charges nothing, when unfunded.
- **IAP purchases** need App Store Connect products + `APPLE_IAP_SHARED_SECRET` before they work (see `IAP_SETUP.md`). Google verify is a stub.
- Credit costs are centralized in `ai.service.ts` `CREDIT_COST` (text1/cards2/image3/pdf5); media dominates + is charged full-cost-upfront.
- Refresh tokens are not rotated; access tokens stay valid up to 15m after logout.

## Commands
```bash
# Frontend
cd frontend && npx react-native start           # Metro
cd frontend && npx react-native run-ios         # build to device/sim
cd frontend && npx tsc --noEmit                 # type check
cd frontend && npm run lint                     # ESLint
# Backend
cd backend && npm run dev                        # ts-node-dev
cd backend && npx prisma studio                  # DB GUI
cd backend && npx prisma migrate dev             # run migrations
```

## Skills
`/feature-dev` (new screen/component) · `/code-review` (bugs pre-commit) · `/simplify` (cleanup) ·
`/frontend-design` (styling, web-focused — adapt to RN) · `/claude-api` (Claude integration) ·
`/meditation-parity <ScreenName>` (audit + fix a screen for Meditation theme parity — dark/light mode, card bg, shadows, tints).
Subagent roles: `feature-dev:code-architect` (design), `code-explorer` (trace), `code-reviewer` (review),
`rn-screen-builder`/`rn-reviewer` (RN-specific), `Explore` (fast search), `safe-committer` (commit).
