# Release 1.1.0 (Android versionCode 9 · iOS build 5)

Prepared 2026-10-28. Previous store release: 1.0.1 (tag `v1.0.1`).

## What's in it
- "Quiet morning" redesign of every screen (Home, Library, Quiz, Ask, Profile, Friends, Notes, Media).
- Full QA pass (16 groups, ~343 tests) with every bug fixed — see `QA/Test Checklist.md`.
- Verse of the day in the app language (6 free Bibles), 24-hour clock where the language uses it.
- Offline banner no longer covers screen headers. All 6 languages complete.
- Terms: community rules (zero tolerance, report/block, 24 h review) for Apple 1.2.
- AI: OpenRouter model failover (`AI_FALLBACK_MODELS`).
- Website: privacy + terms rewritten to match the app; new screenshots; store screenshots regenerated
  (`branding/store-screenshots/framed` = Play 1290×2796, `framed-ios` = App Store 6.5"/6.7" 1284×2778).

## Steps (in order)
> ✅ 2026-10-28: steps 0–2 DONE by Claude (pushed ca80e92; backend deployed health=200/authMe=401; website live + verified; old site backed up at server `/root/site-backup-20261028.tgz`). Prod AI_MODEL = google/gemini-2.5-flash-lite, fallback default gpt-4o-mini applies.

0. **Push**: `git push origin master` (Claude is blocked from pushing; the Mac needs it for the iOS build).
1. **Backend** (owner runs, auto-mode blocks Claude): `dist/` is already built (rebuild with `cd backend && npx tsc` only if backend changed), then `! bash backend/scripts/deploy-prod.sh` → want `health=200 authMe=401`. No DB migration in this release.
   Optional prod `.env`: `AI_FALLBACK_MODELS=openai/gpt-4o-mini` (that is already the default).
2. **Website**: `scp legal/index.html legal/privacy.html legal/terms.html root@94.130.176.8:/var/www/getverdance/` and
   `scp legal/screens/*.png root@94.130.176.8:/var/www/getverdance/screens/` and `scp legal/screens/3d/*.webp root@94.130.176.8:/var/www/getverdance/screens/3d/`.
3. **Android**: upload `frontend/android/app/build/outputs/bundle/release/app-release.aab` to Play Console → Production → new release; replace phone screenshots with `branding/store-screenshots/framed/*`.
4. **iOS** (Mac): `git pull`, `cd frontend && npm install && cd ios && pod install`, archive with Release config (pins `.env.production`), upload, create version 1.1.0 in ASC, attach build 5, replace screenshots with `framed-ios/*`, submit. Pre-resubmit checklist: [[app_store_rejections]] (purpose strings, billed price biggest, AI consent, build number).
5. RevenueCat sandbox purchase test on both stores.

## Store "What's new" text
A calmer, fresher Verdance. Every screen is redesigned, the verse of the day now appears in your language, and quizzes, notes and offline use are smoother. Plus many small fixes.
