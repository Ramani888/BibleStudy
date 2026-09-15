---
tags: [architecture]
updated: 2026-08-08
---

# Architecture Overview

**BibleStudyPro** is a full-stack mobile app: a **React Native 0.84 / React 19**
client (no Expo) talking to a **Node.js + Express 4 + TypeScript** API backed by
**PostgreSQL 16** via **Prisma 5**. Base API path: `/api/v1`.

It is three products in one codebase:
1. **Study core** — flashcard sets/cards organised in folders, an AI Bible
   assistant, a credit economy, quiz, study plans, notes, and media uploads.
2. **Social layer** — friends, an activity feed, and push notifications.
   (Groups/Gatherings/Map were fully removed — deferred post-launch.)
3. **Monetization arc** — a free-tier credit economy that graduates into IAP
   subscriptions (`STARTER`/`PRO`), plus gamification (achievements, streaks,
   leaderboard) and study plans to drive retention and church/group revenue.
   See [[Credits & Subscriptions]], [[Gamification]], [[Study Plans]].

## The stack

| Layer | Tech |
|-------|------|
| App | React Native 0.84.1, React 19.2, TypeScript (strict) |
| Client state | Zustand (auth) + React Query v5 (server state) — see [[State & Data Fetching]] |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) — see [[Navigation]] |
| API | Express 4 + `express-async-errors`, modular routers — see [[Backend Architecture]] |
| ORM | Prisma 5 / PostgreSQL 16 — see [[Database Schema]] |
| Auth | JWT access + refresh, OTP email verify — see [[Auth & Token Flow]] |
| Media | local disk `/uploads`, served by `express.static` |
| Hosting | Hetzner CX23 VPS + Caddy + PM2 (currently stopped) — see [[Deployment (Hetzner)]] |

## Request flow (end to end)

```
RN screen  →  hook (React Query)  →  <module>.api.ts  →  axios client.ts
   → [auth interceptor attaches JWT, refreshes on 401]
   → Express route  →  validate middleware (zod DTO)  →  auth middleware
   → controller  →  service (business logic + Prisma)  →  PostgreSQL
```

Return path is the reverse; services return raw data, controllers wrap it via
`utils/response.ts`, React Query caches it.

## Backend module inventory

**17** feature modules under `backend/src/modules/`, each mounted under `/api/v1/*`:

`auth` · `users` · `folders` · `sets` · `cards` · `ai` · `credits` ·
`subscriptions` · `achievements` · `plans` · `friends` · `activities` ·
`notifications` · `notes` · `media` · `quiz` · `waitlist`

The additions since the 16-module baseline are `subscriptions` (IAP
entitlements — [[Credits & Subscriptions]]), `achievements`
([[Gamification]]), `plans` (personal & group study plans —
[[Study Plans]]), and `waitlist`. `groups`/`gatherings`/`map` were fully
removed (deferred post-launch).

Grouped in this brain as: [[Module - Auth & Users]],
[[Module - Library (Folders, Sets, Cards)]], [[Module - AI & Credits]],
[[Module - Social (Friends, Activities, Notifications)]], [[Module - Media & Notes]].

## Frontend surface

5-tab shell (Home · Library · Quiz · AI · Profile), **~67 screens**, plus a
large Profile stack that hosts social, monetization (Paywall), and gamification
(Achievements, Leaderboard) features. Study Plans live under LibraryTab; the
Quiz runner is a root-level screen above the tabs. Groups/Gatherings/Map fully
removed (deferred post-launch). Full list in [[Screen Map]] · [[Navigation]].

## Notable facts / gotchas

- **Module count:** the actual backend has 17 (adds `subscriptions`,
  `achievements`, `plans`, `waitlist` over the 16-module baseline).
  `groups`/`gatherings`/`map` were fully removed (deferred post-launch).
- The client is **mobile-only** — Express CORS allows requests with no `Origin`
  header unconditionally (RN isn't a browser). See `backend/src/app.ts`.
- Body limit is **10mb** (media metadata + base64 edge cases).
- See [[Migration History]] for the Prisma migration reconciliation done 2026-08-04.
