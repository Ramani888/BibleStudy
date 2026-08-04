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

## Notes
- `User` is the cascade root for the whole schema.
- Blocking lives in the [[Module - Social (Friends, Groups, Gatherings, Map)|social module]],
  but affects what a user profile exposes.
