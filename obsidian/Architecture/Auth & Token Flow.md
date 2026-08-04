---
tags: [architecture, backend, auth]
---

# Auth & Token Flow

Owned by `backend/src/modules/auth/` + `utils/jwt.ts` + `middlewares/auth.middleware.ts`.
On the client: `frontend/src/store/auth.store.ts` (Zustand) and the axios
interceptor in `frontend/src/api/client.ts`.

## Tokens

- **Access token** — short-lived JWT (`JWT_ACCESS_EXPIRES=15m`). Sent as
  `Authorization: Bearer <token>` on every request.
- **Refresh token** — long-lived (`JWT_REFRESH_EXPIRES=30d`), persisted in the
  **RefreshToken** table (see [[Database Schema]]) so it can be rotated/revoked.
- Both signed via `utils/jwt.ts` (separate `JWT_ACCESS_SECRET` /
  `JWT_REFRESH_SECRET`).

## Registration & email verification

1. `POST /api/v1/auth/register` → creates User, issues an **OtpToken**.
2. OTP emailed via `utils/email.ts` (Gmail SMTP).
3. `POST /api/v1/auth/verify-email` with the OTP marks the account verified.
4. Password reset uses the same OTP mechanism (`forgot-password` /
   `reset-password`).

Client screens: [[Screen Map|Register → VerifyEmail → ForgotPassword → ResetPassword]].

## Login & refresh cycle

1. `POST /auth/login` → returns access + refresh tokens; client stores them
   (secure storage) and sets `auth.store` to authenticated.
2. `auth.middleware.ts` verifies the access token on protected routes and
   attaches `req.user`.
3. On a **401**, the axios interceptor in `client.ts` transparently calls the
   refresh endpoint, swaps in a new access token, and retries the original
   request once. **Do not change this logic without a full review** (per CLAUDE.md).
4. Logout revokes the stored RefreshToken.

## Client integration

- `store/auth.store.ts` — Zustand store holding auth state + tokens; the single
  source of truth for "am I logged in".
- `api/client.ts` — the axios instance; request interceptor attaches the token,
  response interceptor handles refresh-on-401. See [[Hooks & API Layer]].

## See also
- [[Backend Architecture]] — where auth middleware sits in the request lifecycle
- [[State & Data Fetching]] — how auth state gates the navigators
