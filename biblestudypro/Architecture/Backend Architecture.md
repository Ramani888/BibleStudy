---
tags: [architecture, backend]
---

# Backend Architecture

Node.js + Express 4 + TypeScript. Entry: `backend/src/server.ts` (boots DB then
listens) → `backend/src/app.ts` (builds the Express app, mounts routes).

## Directory layout (`backend/src/`)

```
server.ts          → startServer(): connectDB() then app.listen(PORT)
app.ts             → express app: CORS, json(10mb), rate limit, /health, routes
config/
  db.ts            → PrismaClient singleton (+ connectDB/disconnectDB)
  env.ts           → validated environment config
  s3.client.ts     → Hetzner S3-compatible client for media
middlewares/
  auth.middleware.ts      → verifies JWT access token, attaches req.user
  rateLimit.middleware.ts → generalRateLimit (global) + per-route limits
  validate.middleware.ts  → runs a zod DTO against req, 422 on failure
modules/<feature>/ → the 15 feature modules (see below)
utils/
  jwt.ts           → sign/verify access & refresh tokens
  email.ts         → OTP / transactional email (Gmail SMTP)
  response.ts      → sendSuccess / sendError envelope
  errors.ts        → AppError + typed error classes
  activity.ts      → helper to record Activity feed entries
  notifications.ts → helper to create + push notifications
types/             → shared backend TS types
```

## Module anatomy

Every module under `modules/<feature>/` follows the same 4-file shape:

| File | Responsibility |
|------|----------------|
| `<f>.routes.ts` | Express router; wires middleware + controller handlers |
| `<f>.controller.ts` | HTTP glue — reads req, calls service, sends response |
| `<f>.service.ts` | Business logic + all Prisma access (no HTTP here) |
| `<f>.dto.ts` | zod schemas for request validation |

This mirrors the frontend's per-module `<module>.api.ts` layer — see
[[Hooks & API Layer]].

## Request lifecycle

1. `express-async-errors` is imported **first** in `app.ts` — patches Express 4
   so `throw` inside async handlers propagates to the error middleware.
2. `app.set('trust proxy', 1)` — real client IP through Caddy for rate limiting.
3. CORS: no-origin (mobile) always allowed; browser origins only if they match
   `CLIENT_URL` (or in development).
4. Global `generalRateLimit`, then `express.json({ limit: '10mb' })`.
5. `GET /health` runs `SELECT 1` to verify DB connectivity.
6. Feature routers mounted at `/api/v1/<feature>`.
7. Errors funnel through `AppError` → `sendError`.

## Conventions

- **Services own Prisma.** Controllers never touch the DB directly.
- **Validation is zod DTOs** via `validate.middleware.ts`, not ad-hoc checks.
- **Responses** go through `utils/response.ts` for a consistent envelope.
- **Auth** is enforced by `auth.middleware.ts` on protected routers.

## See also
- [[Auth & Token Flow]] — the JWT + OTP mechanics
- [[Database Schema]] — the Prisma models services read/write
- [[Architecture Overview]] — the full request path incl. the client
