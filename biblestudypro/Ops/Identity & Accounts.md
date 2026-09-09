---
tags: [ops, identity, accounts]
updated: 2026-09-09
---

# Identity & Accounts

> ⚠️ Authoritative source for app identity. Older notes saying `com.biblestudypro.app`
> for the bundle/package are **superseded** — see the migration reason below.

## App name (user-facing) = **Verdance** (both platforms)
- iOS: `CFBundleDisplayName = Verdance` (`ios/frontend/Info.plist`)
- Android: `app_name = Verdance` (`android/app/src/main/res/values/strings.xml`)
- Store listings (App Store Connect + Play Console): **Verdance**
- Internal only (NOT the launcher label): `app.json` `name: BibleStudyPro` (RN AppRegistry
  component id — do not change), `displayName: "BibleStudy Pro"` (unused/stale).

## Bundle ID / applicationId = **`com.getverdance.app`** (both platforms)
- iOS bundle: `com.getverdance.app` (`project.pbxproj` PRODUCT_BUNDLE_IDENTIFIER)
- Android applicationId: `com.getverdance.app` (`android/app/build.gradle`)
- Android internal Kotlin **namespace stays `com.biblestudypro.app`** (invisible, kept to avoid churn)
- **Why changed (2026-09-09):** the original `com.biblestudypro.app` was registered on an
  Apple team the user has NO access to (a previous developer's), so it could never ship on iOS.
  Matched Android to it. Chosen to align with the owned domain getverdance.com.

## Product IDs = `com.biblestudypro.*` (UNCHANGED)
`com.biblestudypro.{starter,pro}.{monthly,annual}` — independent of the bundle id, kept as-is.

## Cloud accounts (re-homed to the user's WORK Google account, 2026-09-09)
- **Firebase project:** `verdance-bb5c2` (project number `169277764350`). Old `biblestudy-2b14c`
  was on an inaccessible account — abandoned.
- **Google Sign-In OAuth (verdance-bb5c2):** iOS client `169277764350-k1ldne34ha1gj88vi7ckdp4almbv3e15`,
  Web client `169277764350-kbrebkkq0ag11cp2l7mlq32voaipo6d4` (backend audience + RN webClientId).
- **APNs auth key:** Key ID `Y66XF82J66`, Team `CG433GC6BU` (uploaded to Firebase, dev+prod).
- **SHA-1s in Firebase:** debug `E5:77:83:BD:B6:13:17:08:32:04:C1:7D:38:D1:D5:57:0A:6E:D2:31`,
  release/upload `E7:C6:28:DC:AD:71:FE:1E:42:E5:12:00:C3:7F:63:13:48:39:08:11` (add Play App
  Signing SHA-1 after enrolling).
- **Apple Developer team:** `CG433GC6BU` (Divyesh Ramani).
- **Domain/API:** getverdance.com; API `https://api.getverdance.com` (Hetzner Caddy + Let's Encrypt).

## Related
[[Push Notifications]] · [[Module - Auth & Users]] · [[Google Credentials]] · [[Brand & Assets]]
· repo `STORE_SETUP.md`, `REVENUECAT_MIGRATION.md`
