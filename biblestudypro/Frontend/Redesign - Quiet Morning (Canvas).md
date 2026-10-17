---
tags: [frontend, design, redesign, canvas]
updated: 2026-10-17
status: in-review (design only — NOT implemented)
---

# Redesign — "Quiet Morning" (design canvas)

> **Status (2026-10-17):** every screen is designed on the canvas (version **93**). The owner is
> **reviewing every screen in detail** and asks for fixes one by one.
> **No app, store, branding or website file changes until the owner explicitly says implementation starts.**
> Supersedes the look in [[Design Language (Calm Serene)]] once implemented.

**Canvas:** https://claude.ai/artifact/7EkwqaPHCFmwuUXvJnyHCk (claude.ai Design artifact, private)

Design statement (owner's choice): *"A quiet morning with your Bible: warm, calm and alive."*

## Working rules (owner's)
- Design **every** screen on the canvas first. Implement only when the owner says so.
- When asked to change something, change **only that** (two broader restyles were reverted).
- Research before each design step; design **light and dark** for every screen.
- Premium = **restraint**: gradients only as a soft light fog; no strong glows, halos or rainbow auras.

## Canvas map (pages) — reorganized by app tab, v86 (2026-10-17)
| Page (id) | Screens |
|---|---|
| Shared parts (`shared`) | Tab bar, Icons, App icon preview, Loading/offline/error/empty states (neutral "Screen title", no tab lit), design-system sticky |
| Sign-in & first run (`g1`) | Splash, Onboarding, Login, Register, VerifyEmail, ForgotPassword, ResetPassword, Terms |
| Home (`core`, opens first) | Home (`Main`), VerseCard |
| Library (`g2`) | Library, SetDetail, FolderDetail, SetForm/EditSet, CardForm/EditCard, StudyPlans, PlanDetail, CreatePlan, PublicSets/FriendsSets |
| Quiz: hub & setup (`g3`) | QuizHub, QuizSetup, QuizDetail |
| Quiz: play & results (`g3b`) | Quiz play (7 types), Results, QuizSummary |
| Ask (`g4`) | AIConsent, AIChat, ChatHistory |
| Profile: me & subscription (`g5`) | Profile, Paywall, Credits, Achievements, Leaderboard |
| Profile: settings & account (`g5b`) | Settings, NotificationSettings, Notifications, EditProfile, ChangePassword, AboutUs, PrivacyPolicy |
| Profile: friends (`g6`) | Friends, FriendRequests, SearchUsers, UserProfile, InviteFriends, BlockedUsers |
| Profile: notes & media (`g6b`) | Notes, NoteEditor, Media, MediaPDFViewer, MediaImageViewer |

63 screens, each with a light board (row y=0) and a dark board (row y=1900).

## Visual system (as it stands)
- **One violet everywhere:** `#6D4AE0` (dark mode buttons `#7C5CF0`, links `#B3A0FA`). Splash background, logo tiles and buttons all use it.
- **Light:** bg `#FBF9F6`, card `#FFFFFF`, ink `#221E33`, body `#4A4458`, muted `#6B6580`, lilac `#EEE9FB`.
- **Dark:** bg `#14111B`, surface `#1D1927`, ink `#F2EEF8`, body `#CFC8DC`, muted `#A69FB6`.
- **Highlight cards** (review, premium, credits…): `#EEE7FC→#F3ECF8→#FBF1EA` / dark `#2A2140→#231C33→#2A1F2E`. **Verse cards:** `#FCF6EE→#FAF2EE→#F6EFF8` / dark `#241D2C→#211B2B→#221C33`.
- Gold `#B8812E` (text `#8A6020`) for streak/progress; leaf `#4F8A5B`; danger `#B4473A` / `#E58C7E`.
- **Fonts:** Literata (Scripture + headings), Figtree (UI).
- **Motion:** press scale 0.97 + light haptic; fade-up .32s/12px; AI "working" = calm solid violet outline (no rainbow); loading skeleton = gentle opacity pulse; Reduce Motion respected.
- **Light fog (v84–85, 2026-10-17):** gradients are back, but only as a soft light fog. Highlight cards fade violet→warm cream; verse/warm cards fade cream→hint of lilac; auth, onboarding, AI consent and Paywall get a faint lilac + warm fog at the top of the page; Splash gets a gentle haze that fades in. Dark mode is even quieter. Still **no** strong glows, halos or rainbow edges.

## Consistency rules decided
- **Logo:** the real emblem (V meeting at a rising leaf) everywhere — Splash, Login, About.
- **Icons:** one drawing per idea (126 shapes); stroke **1.8** at ≥20px, **2** at 16–19px, **2.2** at ≤15px. Leaf always has its stem. One chat bubble app-wide.
- **Sheets:** plain rows everywhere — 22px line icon (violet; red for delete), label, 54px rows, hairline between. No icon tiles.
- **Same in light and dark:** Splash (solid violet), Photo viewer and PDF reader (always the dark view). Every other screen follows light/dark.
- **Viewers:** round see-through buttons with white icons; both close with **✕**.
- Tab bar on every tab screen; full-screen exceptions: quiz play, Results, QuizSummary, NoteEditor, Paywall, PDF reader, bottom-sheet forms, auth.
- Plain back arrow; "Terms of Use" everywhere; tab-root titles 32px, inner titles 30px; bottom button 56px/18 radius, in-sheet 52/16.
- Floating bottom buttons sit on a solid background strip so list content never shows underneath.

## Full audit (2026-10-17)
Every module checked against the real code: [[Redesign Audit 2026-10-17]]. Structure is right; main gaps = missing states, made-up data/promises, hard-coded back buttons. All audit fixes applied module by module (v87–v93); progress list inside the audit note.

## What the redesign adds (canvas only, not built yet — listed 2026-10-17)

### Brand-new features (the app doesn't have these today)
1. **Today's verse on Home** — daily verse card (Berean Standard Bible) with "Memorize this" (adds it to your verses) and share.
2. **Daily reminder** — in NotificationSettings: Morning / Midday / Evening or your own time, with a message preview. *(decide later)*
3. **AI on/off switch in Settings** — lets people turn the AI helper off (Apple 5.1.2(i)). *(decide later)*
4. **Report a user** — on UserProfile (Apple 1.2; no way to report today).
5. **Show quiz timer** — Settings option; quizzes have no clock by default.
6. **Verse chips in notes** — tap a verse reference to see it; notes autosave.
7. **Due-cards limit** — Home shows e.g. "12 today, 38 this week". Needs backend. *(decide later)*

### Improvements to things that already exist
- **Home** adapts: "cards are ready" / "pick up where you left off" / "start here"; old "weekly goal 7/7" removed (it was just the streak).
- **Blocked users** reachable from Settings (screen exists today but nothing links to it).
- **Sign-up:** live password checklist instead of errors after pressing the button.
- **Email code:** auto-advance, paste + autofill, auto-check on the 6th digit, resend countdown.
- **Splash:** opens as soon as the app is ready (today it always waits 2+ seconds).
- **Quiz:** typed answer turns green/orange after Check; Results never close on their own.
- **Quiz setup:** attach sheet shows the credit cost of each option, like AI chat.
- **Achievements:** top card "5 of 17 reached" + next goal.
- **Settings:** theme choice Light / Dark / Phone.
- **Loading, offline, error and empty screens** designed.

### Honesty fixes (wording only)
- **Paywall:** removed promises the app doesn't keep ("group sessions", "advanced analytics").
- **In-app Privacy Policy:** names PostHog, Crashlytics, RevenueCat, Google; drops the wrong "30 days" deletion claim.
- **Terms:** billing names both the App Store and Google Play.

### Removed
- Onboarding "What would you like to grow in?" step (dropped 2026-10-17; onboarding = 3 steps).

**Needs real new code (incl. backend) when building:** daily reminder, AI switch, due-cards limit, Report user. The rest is mostly screen and wording work.

## Decisions still open (owner) — deferred, "we will decide later" (2026-10-17)
~~1. Onboarding step 4 "grow in" goals question~~ — **dropped** (v83, 2026-10-17): the answer was never used. Onboarding = 3 steps.
~~2. "Create my account" → Register~~ — **yes** (v83), with "I already have an account. Sign in" → Login under it.
3. Daily reminder (NotificationSettings) — new feature, needs OK.
4. AI on/off toggle in Settings (needed for Apple 5.1.2(i)).
5. Sign out only in Settings.
6. Due-backlog cap ("12 today, 38 this week" needs backend).
7. **App icon:** solid violet `#6D4AE0` preview is on the canvas (`AppIcon` board). The real icon was regenerated once, then **reverted** at the owner's request — still the old violet→indigo gradient in the repo.

## Implementation to-do (only when the owner says go)
- Launch screens must switch to `#6D4AE0` with the icon/splash, or there is a colour jump on open:
  iOS `LaunchScreen.storyboard` (today `#6366F1`), Android `drawable/splash_screen.xml` + `values/notification_color.xml`.
- App icon: change `branding/build-icons.mjs` + `branding/verdance-emblem.svg` to solid `#6D4AE0`, also Android
  `drawable/ic_launcher_bg.xml` + `values/ic_launcher_background.xml`; run `cd frontend && node ../branding/build-icons.mjs`;
  then re-upload store icon + Play feature graphic and deploy `legal/` images. See [[Brand & Assets]].
- Copy fixes found during design: "Order the chunks" → "Order the pieces" (i18n `quiz.json`), Terms billing now names App Store + Google Play
  on the canvas (v83) — copy that into the app's Terms and check the getverdance.com terms page too, Home/"Ask AI" bypass AI consent, composer always says 1 credit (card answers cost 2).
- Product gaps found: no Report-user feature (Apple 1.2 risk), BlockedUsers screen orphaned, in-app privacy policy
  omits PostHog/Crashlytics/RevenueCat/Google and has a wrong "30 days" deletion claim.
- **From the 2026-10-17 audit (full list + per-module build notes in [[Redesign Audit 2026-10-17]]):**
  - Backend needed: Report user (endpoint + review), verse chips in notes (Note field + migration), "Memorize this" → auto-created "Daily verses" set, hand-picked 365-verse WEB list, due-cards limit (deferred), daily reminder (deferred).
  - Real-app bugs to fix: Home "Ask" + Library card "Ask AI" bypass AI consent; chat header says "Powered by Claude"; SearchUsers shows "Sent" for incoming requests + "name or email" placeholder (name-only); visibility "Friends" called "Shared link"; iOS can't quit a running quiz; onboarding always lands on Login (owner chose Register).
  - Copy: "Terms of Service" everywhere; app strings "Images" → "Photos"; retire quiz `modeNames`.

## History (short)
- 2026-10-16: all 6 groups designed; consistency pass; Home + quiz play rebuilt from real code; every screen screenshot-checked.
- Tap/sheet states checked (~45 states) and overlaps fixed; icon + logo consistency pass.
- Forest-green theme demo tried and **removed** (owner kept violet). A broader "calm luxury" restyle was **reverted**;
  only gradients/glows were removed (v70).
- Splash made identical in both modes, then switched to the one theme violet; viewer buttons unified; sheets plain.
- 2026-10-17: owner decisions (onboarding 3 steps, Create my account → Register, Terms billing both stores); light fog gradients brought back (v84–85); full 7-module audit vs real code; canvas pages reorganized by app tab (v86); every module fixed v87 Home · v88 Sign-in · v89 Library · v90 Quiz · v91 Ask · v92 Profile · v93 Friends/Notes/Media (~70 new state/variant boards). Implementation still not started.

Related: [[Brand & Assets]] · [[Design Language (Calm Serene)]] · [[Theme & Components]] · [[Screen Map]] · [[Sheet & Modal Components]]
