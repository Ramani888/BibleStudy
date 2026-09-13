---
tags: [backend, module, growth]
---

# Module — Waitlist

Pre-launch email capture for the marketing site. Powers staggered, by-country
launch invites (see [[Social]] growth work and the [[Landing Page]]).
Path: `backend/src/modules/waitlist/`. Mounted at `/api/v1/waitlist`.

## Endpoints (both public / unauthenticated)
- `POST /api/v1/waitlist` — join. `authRateLimit` + `validate(CreateWaitlistDto)`.
- `GET  /api/v1/waitlist/count` — total signups (the site renders this as social proof).

The marketing site posts from the browser, so `app.ts` CORS allows its Origin.

## Model
**Waitlist** — `id`, `email` (**@unique**), `country?`, `createdAt`. Indexed by `createdAt`.

## Behaviour (service)
- **Idempotent join**: re-submitting the same email *updates* `country` instead of
  throwing on the unique constraint, so a double-submit still "succeeds".
- **Position**: returns the signup's 1-based place in line = count of rows created
  `<= createdAt` (stable across re-submits).
- **Welcome email**: sent only on first sign-up, fire-and-forget via
  `utils/email.sendWaitlistWelcomeEmail` — a mail failure never fails the request.

## DTO + anti-spam
`CreateWaitlistDto` (zod): `email` (trimmed, lowercased, validated, ≤320),
`country?` (≤100), and a **`company` honeypot** (`max(0)` — hidden in the form, so
a real user leaves it empty and bots that fill it are rejected).

## See also
- [[Database Schema]] · [[Landing Page]] · [[Identity & Accounts]]
