---
tags: [backend, module]
---

# Module — Auth & Users

Paths: `backend/src/modules/auth/`, `backend/src/modules/users/`.
Mounted at `/api/v1/auth` and `/api/v1/users`.

## auth
Registration, login, email verification (OTP), password reset, token refresh &
logout. Full mechanics in [[Auth & Token Flow]].

- Models: **User**, **RefreshToken**, **OtpToken**, **DeviceToken**
  (see [[Database Schema]]).
- Utils: `utils/jwt.ts`, `utils/email.ts`.
- Middleware produced/consumed: `auth.middleware.ts` guards every other module.

## users
Profile CRUD, public user profiles, account settings, device-token registration
for push.

- Client hooks: `useProfile`, `useUser` — see [[Hooks & API Layer]].
- Screens: Profile, EditProfile, ChangePassword, Settings, UserProfile
  (see [[Screen Map]]).

## Social Auth (Google & Apple)

Routes: `POST /api/v1/auth/google`, `POST /api/v1/auth/apple`

### Google Sign-In
- Backend verifies ID token via `google-auth-library` using `GOOGLE_CLIENT_ID` (Web Client ID) in `backend/.env`
- Frontend gets ID token via `@react-native-google-signin/google-signin` configured with `GOOGLE_IOS_CLIENT_ID` + `GOOGLE_WEB_CLIENT_ID` from `frontend/.env`
- Google Cloud project: `bible-study-504809` (project number `206724613277`)
- iOS OAuth Client ID: `206724613277-cbh8i1berlf1g6fr03hs5enuapenamh4.apps.googleusercontent.com` ✅
- Web OAuth Client ID: `206724613277-l6ch6sre18joco08p17rq8jk2grsai60.apps.googleusercontent.com` ✅

### Apple Sign-In
- Backend verifies identity token via `apple-signin-auth` using `APPLE_BUNDLE_ID=com.biblestudypro.app` in `backend/.env` ✅
- Frontend uses `@invertase/react-native-apple-authentication`
- Requires: Apple Developer account + Sign In with Apple capability enabled for `com.biblestudypro.app`
- **Only works on physical iOS device**, not simulator

### Bundle / Package IDs (set 2026-08-07)
- iOS: `com.biblestudypro.app` (in `ios/frontend.xcodeproj/project.pbxproj`)
- Android: `com.biblestudypro.app` (in `android/app/build.gradle`)

## Notes
- `User` is the cascade root for the whole schema.
- Blocking lives in the [[Module - Social (Friends, Groups, Gatherings, Map)|social module]],
  but affects what a user profile exposes.
