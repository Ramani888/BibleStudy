---
title: BibleStudyPro — Brain
tags: [home]
updated: 2026-08-04
---

# ✝️ BibleStudyPro — Architecture Brain

Knowledge vault for **BibleStudyPro** — a Bible-study flashcard app with an AI
assistant and a social/community layer (friends, groups, in-person gatherings on
a map). Full-stack: **Node/Express/Prisma/PostgreSQL** backend + **React Native
0.84 / React 19** app.

> This is a *code brain*, not a design vault — it documents how the system is
> built. Notes are cross-linked; open the graph view to navigate.

## 🧭 Start here
- [[Architecture Overview]] — the whole system on one page
- [[Database Schema]] — Prisma models & relations
- [[Navigation]] — screen/tab map of the app

## 🖥️ Backend
- [[Backend Architecture]] — layering, request lifecycle, conventions
- [[Auth & Token Flow]] — JWT access/refresh, OTP email verification
- Modules:
  - [[Module - Auth & Users]]
  - [[Module - Library (Folders, Sets, Cards)]]
  - [[Module - AI & Credits]]
  - [[Module - Social (Friends, Groups, Gatherings, Map)]]
  - [[Module - Media & Notes]]

## 📱 Frontend
- [[Frontend Architecture]] — directory map, conventions
- [[Navigation]] — navigators, tabs, stacks
- [[State & Data Fetching]] — Zustand + React Query
- [[Screen Map]] — every screen and its data source
- [[Hooks & API Layer]] — how screens talk to the backend
- [[Theme & Components]] — design tokens + component library
- [[Design Language (Calm Serene)]] — app-wide redesign reference (start here for styling)

## 🛠️ Ops
- [[Local Dev Setup]] — running locally (Postgres 5434)
- [[Deployment (Hetzner)]] — the VPS setup (currently stopped)
- [[Migration History]] — Prisma migration timeline & the reconciliation

## Conventions for this vault
- One note per concept/module; link liberally with `[[wikilinks]]`.
- Keep facts anchored to real paths (e.g. `backend/src/modules/ai/`).
- Update the `updated:` date and this hub when structure changes.
- A [graphify](../graphify-out/) knowledge graph also exists — this vault is the
  hand-curated companion to it.
