---
title: Auth & Account
tags: [feature, auth]
updated: 2026-08-14
---

# Auth & Account

> Email/password + Google/Apple sign-in, email verification, password recovery, session/token management, and profile/account settings.

## Screens
One row per screen in this area. Route = the navigation route name.

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| LoginScreen | `Login` | AuthStack | Email/password login + Google/Apple buttons; links to Register & ForgotPassword |
| RegisterScreen | `Register` | AuthStack | Create account (name/email/password) + social buttons; routes to VerifyEmail |
| VerifyEmailScreen | `VerifyEmail` `{ email }` | AuthStack | Enter 6-digit OTP to verify email (auto-login on success); resend code |
| ForgotPasswordScreen | `ForgotPassword` | AuthStack | Request password-reset OTP by email |
| ResetPasswordScreen | `ResetPassword` `{ email }` | AuthStack | Enter OTP + new password; resend code |
| OnboardingScreen | (pre-auth gate) | Root | 1st-launch carousel; sets an AsyncStorage flag then falls through to AuthStack |
| ProfileScreen | `Profile` | ProfileStack | Profile header + stat tiles + menu hub; sign-out with confirm |
| EditProfileScreen | `EditProfile` | ProfileStack | Edit name / bio / church (photo upload is stubbed) |
| ChangePasswordScreen | `ChangePassword` | ProfileStack | Change password, or **set** a first password for social-only accounts |
| SettingsScreen | `Settings` | ProfileStack | Dark-mode toggle, Sign Out, Delete Account, version info |

## Features & functionality

**LoginScreen**
- Email + password fields (react-hook-form + zod), "Sign In" button with loading state.
- If login returns `EMAIL_NOT_VERIFIED` (403), navigates to `VerifyEmail` with the entered email instead of erroring.
- If login returns `SOCIAL_LOGIN_ONLY` (401), sets `socialOnly` state → shows a banner: "This account was created with Google. Use the Continue with Google button above."
- "Continue with Google" / "Continue with Apple" buttons (`socialLoading` per-provider spinner); errors shown via Toast.
- Links: → Register, → ForgotPassword.

**RegisterScreen**
- Name / email / password fields; password placeholder documents rule "Min 8 chars, 1 uppercase, 1 number".
- On success navigates to `VerifyEmail { email }` (no tokens issued yet).
- Same Google/Apple buttons as Login. Link → Login.

**VerifyEmailScreen**
- 6-digit OTP input; "Verify Email" button. On success stores tokens + sets authenticated (auto-login).
- "Resend code" (calls `authApi.resendVerification`, `resending` disabled state). Link → Login.

**ForgotPasswordScreen**
- Email field; "Send Reset Code" → navigates to `ResetPassword { email }`. Link → Login.

**ResetPasswordScreen**
- OTP + new password + confirm password fields; "Reset Password" → navigates to Login on success.
- "Resend code" resends the reset OTP.

**OnboardingScreen**
- Multi-slide carousel; "Next" / "Get Started" / "Skip" all call `markAndComplete` (persists a flag so it shows only once).

**ProfileScreen**
- Header: avatar, name, email. Bell icon → Notifications.
- Stat tiles: Streak, Credits, Sets, Cards, Notes. Storage row → Media (or `Paywall` when `overQuota`).
- Menu: Achievements, My Notes, My Media, Friends, Groups, Notifications, Edit Profile, Credits, Paywall, Change Password, Settings.
- "Sign Out" opens a confirm modal → `logout`.

**EditProfileScreen**
- Edits name / bio / church. "Change Photo" shows an "image upload coming soon" Toast (not implemented).

**ChangePasswordScreen**
- `hasPassword` (from store, default `true`) drives the form: if `true` shows "current password" field (required); if `false` (social-only) hides it and the flow becomes "set password".
- On success for a social-only account, optimistically sets `user.hasPassword = true` in the store; Toast text differs ("Password changed!" vs "Password added!").

**SettingsScreen**
- Dark Mode toggle, Sign Out (confirm → `logout`), Delete Account (confirm → `deleteAccount`), Version + branding rows.

## Data flow
`Screen → useAuthStore action → auth.api / users.api fn → METHOD /api/v1/... → controller → service → Prisma`

- Auth is **Zustand**, not React Query — actions live in `frontend/src/store/auth.store.ts`.
- `login` → `authApi.login` → `POST /auth/login` → `authService.login`.
- `verifyEmail` → `POST /auth/verify-email` → `authService.verifyEmail` (returns tokens+user).
- `loginWithGoogle` → `getGoogleIdToken()` → `POST /auth/google`; `loginWithApple` → `getAppleCredentials()` → `POST /auth/apple`.
- `initialize` (app start) → `authApi.me` → `GET /auth/me` → `usersService.getProfile`.
- ChangePassword → `usersApi.changePassword` → `PUT /users/change-password`.
- EditProfile → `usersApi.updateProfile` → `PUT /users/profile`.
- Silent refresh → `POST /auth/refresh` from the axios response interceptor in `frontend/src/api/client.ts`.

## Backend

- **Module `auth/`**: `auth.routes.ts` · `auth.controller.ts` · `auth.service.ts` · `auth.dto.ts`.
- **Module `users/`**: `users.routes.ts` · `users.controller.ts` · `users.service.ts` · `users.dto.ts`.
- **JWT util**: `backend/src/utils/jwt.ts` — `generateAccessToken` / `generateRefreshToken` / `verifyAccessToken` / `verifyRefreshToken` (payload `{ userId }`).
- **OTP/email util**: `backend/src/utils/email.ts` — `generateOTP` (6-digit), `storeOTP`, `verifyOTP`, `sendVerificationEmail`, `sendPasswordResetEmail`.
- **Middleware**: `backend/src/middlewares/auth.middleware.ts` (`authMiddleware`), `rateLimit.middleware.ts` (`authRateLimit`).

### Endpoints (all under `/api/v1`)
| Method / Path | Auth | Rate-limited | Purpose |
|---------------|------|--------------|---------|
| `POST /auth/register` | public | ✓ authRateLimit | Create user (unverified), send OTP |
| `POST /auth/verify-email` | public | ✓ | Verify OTP → auto-login (returns tokens+user) |
| `POST /auth/resend-verification` | public | ✓ | Resend verification OTP |
| `POST /auth/login` | public | ✓ | Email/password login |
| `POST /auth/refresh` | public | ✗ | Exchange refresh token for a new access token |
| `POST /auth/logout` | `authMiddleware` | ✗ | Delete the given refresh token row |
| `POST /auth/forgot-password` | public | ✓ | Send reset OTP |
| `POST /auth/reset-password` | public | ✓ | Verify OTP → set new password, revoke all sessions |
| `GET  /auth/me` | `authMiddleware` | ✗ | Current user profile |
| `POST /auth/google` | public | ✓ | Google Sign-In (verify idToken) |
| `POST /auth/apple` | public | ✓ | Apple Sign-In (verify identityToken) |
| `GET  /users/profile` | `authMiddleware` | – | Full profile (incl. storage, `hasPassword`) |
| `PUT  /users/profile` | `authMiddleware` | – | Update name/bio/church/profileImage |
| `PUT  /users/change-password` | `authMiddleware` | – | Change/set password, revoke all sessions |
| `DELETE /users/account` | `authMiddleware` | – | Hard-delete account (cascades) |
| `POST /users/device-token` | `authMiddleware` | – | Upsert push device token |
| `POST /users/device-token/remove` | `authMiddleware` | – | Remove device token |
| `GET  /users/:id` | `authMiddleware` | – | Public profile of another user (block-aware) |

> `users.routes.ts` applies `router.use(authMiddleware)` — **every** user route requires a valid access token.

### Service functions (guards)
- `register` — if email exists but **unverified**, updates name/password and resends OTP (re-register flow); if verified → `ConflictError`. Hashes with bcrypt (12 rounds). Email-send failures are swallowed (logged, not thrown).
- `resendVerification` — returns generic success even if user missing (**anti-enumeration**); `ConflictError` if already verified.
- `verifyEmail` — 404 if no user, `ConflictError` if already verified, `ValidationError` on bad OTP. On success sets `emailVerified=true`, issues tokens, persists a `RefreshToken` row.
- `login` — `UnauthorizedError` on unknown email / bad password; `SOCIAL_LOGIN_ONLY` (401) if `user.password` is null; `EMAIL_NOT_VERIFIED` (403) if unverified. Issues + stores tokens.
- `refreshToken` — looks up the stored token row; deletes it and throws if expired or JWT-invalid; otherwise returns a new access token (**does not rotate** the refresh token).
- `logout` — `deleteMany` on the refresh token row (idempotent).
- `forgotPassword` — generic success even if user missing (**anti-enumeration**).
- `resetPassword` — generic `ValidationError` for missing user or bad OTP; rejects accounts with no password AND no social id; sets new password; **revokes all refresh tokens** for the user.
- `googleAuth` — verifies idToken vs `GOOGLE_CLIENT_ID`; finds by `googleId` OR `email` (links `googleId` onto an existing email account); else creates user with `emailVerified=true`. Not-configured → `ValidationError`.
- `appleAuth` — verifies identityToken vs `APPLE_BUNDLE_ID` with `nonce`; email/name arrive **only on first sign-in** (falls back to token email); links `appleId` or creates verified user.
- `users.getProfile` / `updateProfile` — strip `password`, expose derived `hasPassword` boolean.
- `users.changePassword` — if account already has a password, `currentPassword` is required and verified; social-only accounts can set one without it. Revokes all refresh tokens after change.
- `users.deleteAccount` — `prisma.user.delete` (relies on cascade).
- `users.getUserById` — block-aware (bidirectional), returns friendship/pending-request/mutual-count.

### DTOs (zod)
- **RegisterDto / ResetPasswordDto.newPassword / ChangePasswordDto.newPassword**: min 8, ≥1 uppercase, ≥1 digit.
- **LoginDto.password**: min 1 (any non-empty — real check is bcrypt).
- **VerifyEmailDto / ResetPasswordDto.otp**: exactly 6 chars.
- **UpdateProfileDto**: name 2–100, bio ≤500, church ≤200, profileImage must be a URL — all optional.
- **ChangePasswordDto.currentPassword**: optional (enforced server-side only when a password exists).
- **GoogleAuthDto**: `idToken`. **AppleAuthDto**: `identityToken` + `nonce` (+ optional `fullName`, `email`).

## Data model
`User` (`backend/prisma/schema.prisma`):
- `password String?` (nullable → social-only accounts), `googleId String? @unique`, `appleId String? @unique`, `email @unique`, `emailVerified Boolean @default(false)`.
- Profile: `name`, `bio`, `church`, `profileImage`, `creditBalance`, `plan`, `storageUsed`, `storageLimit`.

`RefreshToken`: `token @unique`, `expiresAt`, `userId`, `@@index([userId])`, `onDelete: Cascade`.
`OtpToken`: `email`, `otp`, `expiresAt` (created per request; verified where `expiresAt > now`).
`DeviceToken`: push token (`token @unique`, `platform`), upserted on `token`.

Deleting a `User` cascades to `RefreshToken`, folders, sets, notes, friendships, etc. — account deletion is a hard delete.

## Edge cases, rules & gotchas

**Token model & expiry**
- Access token `15m`, refresh token `30d` (env `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES`). Separate secrets per token type.
- Refresh tokens are **stored in DB** and validated on `/auth/refresh` (a JWT-valid-but-unknown token is rejected). Access tokens are **stateless** (only JWT-verified in `authMiddleware`, no DB check) — a logged-out access token still works until it expires (≤15m).
- **No refresh-token rotation**: `/auth/refresh` issues a new access token but returns the same refresh token; the stored row lives its full 30 days unless revoked.

**Silent refresh (`frontend/src/api/client.ts`)** — do NOT touch without full review:
- Response interceptor catches 401, sets `_retry` to prevent loops, and refreshes once.
- Concurrent 401s are queued (`refreshQueue`) behind a single in-flight refresh (`isRefreshing`), then replayed with the new token.
- Refresh call uses a **bare `axios.post`** (not `apiClient`) to avoid recursive interception.
- On refresh failure: clears tokens, `queryClient.clear()`, and `useAuthStore.getState().reset()` → forced logout.

**Startup 401-vs-network distinction (`auth.store.initialize`)**:
- On app start, if an access token exists it calls `/auth/me`. Tokens are cleared **only** on a 401 response. Network/server (5xx/timeout) errors must NOT log the user out — this is deliberate; do not "simplify" the `axios.isAxiosError && status === 401` guard.

**Email verification gating**:
- Registration issues no tokens; the user must verify. Login of an unverified account throws `EMAIL_NOT_VERIFIED` (403) — the Login screen intercepts this code and routes to VerifyEmail rather than showing an error.
- `verifyEmail` auto-logs-in (returns tokens+user) so there's no second login step.
- Re-registering an unverified email is allowed and refreshes the password + OTP (not a conflict).

**Social auth / `hasPassword`**:
- `password` is nullable; the API never returns the hash — it returns a derived `hasPassword` boolean instead.
- Social-only accounts (`hasPassword === false`) → LoginScreen shows `SOCIAL_LOGIN_ONLY` banner; ChangePassword becomes a "set password" flow (no current-password field). After setting one, store is optimistically patched `hasPassword: true`.
- Social sign-in **links by email**: signing in with Google/Apple to an address that already has a password account attaches the provider id to that same user (no duplicate account).
- Apple only sends name/email on the **first** authorization — subsequent sign-ins rely on `sub` + token email; if no email is available it errors.
- Google/Apple are gracefully "not configured" errors when `GOOGLE_CLIENT_ID` / `APPLE_BUNDLE_ID` env is empty.

**Password rules**:
- Everywhere a new password is set: min 8, ≥1 uppercase, ≥1 digit (register, reset, change).
- Change/reset both **revoke all refresh tokens** for the user (all other sessions logged out on next 401). Login DTO deliberately only requires min-1 length.

**Logout / delete**:
- `logout` and `deleteAccount` both attempt `removeDeviceToken()` first, then clear tokens + reset store in a `finally` — local state is always cleared even if the network call fails.
- `logout` only deletes the one refresh-token row; other devices keep their sessions.
- Delete is a hard cascade delete — irreversible, wipes all user content.

**Anti-enumeration**: `forgot-password` and `resend-verification` return generic success messages regardless of whether the email exists.

**OTP**: 6 random digits, 10-minute TTL (`OtpToken.expiresAt`); verification filters `expiresAt > now`. Email-send failures are logged and swallowed so the endpoint still succeeds (OTP row is created regardless).

**Rate limiting**: `authRateLimit` = 10 requests / 15 min on all public auth POSTs (register, verify, resend, login, forgot, reset, google, apple). `/auth/refresh` is intentionally **not** rate-limited (would break silent refresh).

**Known limitations / TODOs**:
- Profile photo upload is stubbed ("coming soon" Toast).
- Access-token revocation is not immediate (stateless, 15m window).
- No refresh-token rotation.

## System bar sync

`AuthNavigator` calls `useSystemBars(colors.background)` — sets the Android bottom navigation bar to the page background color while on auth screens. `OnboardingScreen` also calls `useSystemBars(colors.background)`. `SplashScreen` calls `useSystemBars(BRAND_BG)` for the branded launch color. See [[Navigation & Architecture]].

## This session's additions (A–G arc)
Not part of the monetization A–G arc. The adjacent work was the **Google & Apple Sign-In** feature (recent commits: social packages, service wiring, and the `hasPassword` field for social-only accounts) plus the ATS/bundle-ID fixes for local dev. Auth touches monetization only indirectly (`plan` / `creditBalance` live on `User` and surface on ProfileScreen).

## Related
[[Architecture Overview]] · [[Auth & Token Flow]] · [[Database Schema]] · [[Profile & Social]] · [[Credits & Monetization]]
