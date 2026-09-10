---
tags: [frontend, brand, assets]
updated: 2026-09-09
---

# Brand & Assets

Public brand = **Verdance**. Display name (both platforms) = **Verdance**. Bundle ID /
applicationId = **`com.getverdance.app`** (changed 2026-09-09 — see [[Identity & Accounts]]).
RN AppRegistry name stays `BibleStudyPro`.

## Logo
- Mark: a white **"V cradling a leaf"** monoline (leaf = the vesica overlap of two
  circles) on the app's **violet→indigo gradient** `#8B5CF6 → #6366F1` — the theme's
  own `gradientStart → gradientEnd` (`frontend/src/theme/palette.ts`).
- Design rationale (from the iconic-brand playbook): one geometric symbol, one brand
  colour, symbol-on-tile (the WhatsApp/Twitter pattern). Built on a circle grid.
- Full brand system (palette, typography Cormorant/Inter, voice, don'ts): **`branding/BRAND.md`**.

## Everything is generated from one script
`branding/build-icons.mjs` (Node + `sharp` from `frontend/node_modules`). Change the
mark once → **`node branding/build-icons.mjs`** regenerates every size. Source SVGs +
store/web assets live in `branding/` and `branding/store/`.

Wired into the app:
- **App icons** — iOS `AppIcon.appiconset` (1024, no alpha) · Android adaptive
  (gradient `drawable/ic_launcher_bg.xml`) + legacy + round, all densities.
- **Splash** — iOS `LaunchScreen.storyboard` (indigo + `LaunchLogo.imageset`);
  Android `SplashTheme` gradient windowBackground + `MainActivity.setTheme(AppTheme)`.
- **Notification icon** — white `drawable-*/ic_stat_notification.png` + FCM
  `default_notification_icon`/`_color` meta-data (was missing before).
- **Store** — `branding/store/`: App Store 1024, Play 512, Play feature graphic 1024×500.
- **Web** — `legal/`: favicon, apple-touch-icon, og-image 1200×630; meta wired into
  privacy.html + terms.html.

## Gotchas
- Native splash/notif changes NOT build-tested — verify on first `run-ios`/`run-android`.
- `og:image` in legal HTML is relative → make absolute once the domain is live.
- Screenshots (both stores require them) are the one asset class still not made.

## See also
- [[Localization (i18n)]] · [[Theme & Components]] · [[../Rules|Rules]]
