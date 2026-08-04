---
tags: [architecture]
---

# Architecture Overview

**BibleStudyPro** is a full-stack mobile app: a **React Native 0.84 / React 19**
client (no Expo) talking to a **Node.js + Express 4 + TypeScript** API backed by
**PostgreSQL 16** via **Prisma 5**. Base API path: `/api/v1`.

It is two products in one codebase:
1. **Study core** — flashcard sets/cards organised in folders, an AI Bible
   assistant, a credit economy, notes, and media uploads.
2. **Social layer** — friends, groups, in-person "gatherings" plotted on a map,
   an activity feed, and push notifications.

## The stack

| Layer | Tech |
|-------|------|
| App | React Native 0.84.1, React 19.2, TypeScript (strict) |
| Client state | Zustand (auth) + React Query v5 (server state) — see [[State & Data Fetching]] |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) — see [[Navigation]] |
| API | Express 4 + `express-async-errors`, modular routers — see [[Backend Architecture]] |
| ORM | Prisma 5 / PostgreSQL 16 — see [[Database Schema]] |
| Auth | JWT access + refresh, OTP email verify — see [[Auth & Token Flow]] |
| Media | S3-compatible (Hetzner Object Storage) via `s3.client.ts` |
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

15 feature modules under `backend/src/modules/`, each mounted under `/api/v1/*`:

`auth` · `users` · `folders` · `sets` · `cards` · `ai` · `credits` ·
`friends` · `groups` · `gatherings` · `map` · `activities` · `notifications` ·
`notes` · `media`

Grouped in this brain as: [[Module - Auth & Users]],
[[Module - Library (Folders, Sets, Cards)]], [[Module - AI & Credits]],
[[Module - Social (Friends, Groups, Gatherings, Map)]], [[Module - Media & Notes]].

## Frontend surface

Bottom-tab shell (Home · Library · Study · AI · Profile) plus a Map area and a
large Profile stack that hosts the social features. Full list in [[Screen Map]].

## Notable facts / gotchas

- **CLAUDE.md is out of date** on module count — it lists only 7 backend modules;
  there are actually 15 (the whole social layer is undocumented there).
- The client is **mobile-only** — Express CORS allows requests with no `Origin`
  header unconditionally (RN isn't a browser). See `backend/src/app.ts`.
- Body limit is **10mb** (media metadata + base64 edge cases).
- See [[Migration History]] for the Prisma migration reconciliation done 2026-08-04.
