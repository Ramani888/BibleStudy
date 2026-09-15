---
title: BibleStudyPro — Brain
tags: [home]
updated: 2026-09-13
---

# ✝️ BibleStudyPro — Architecture Brain

Knowledge vault for **BibleStudyPro** — an AI-assisted Bible-study flashcard app
with a monetization layer (credits + IAP subscriptions), gamification, study
plans, and a social/community layer. Full-stack: **Node/Express/Prisma/PostgreSQL**
backend (17 modules) + **React Native 0.84 / React 19** app (~67 screens).

> This is a *code brain*, not a design vault — it documents how the system is
> built, feature by feature, including edge cases. Notes are cross-linked; open
> the graph view to navigate.

## 📐 Rules first
- [[Rules]] — project conventions + process (source of truth: repo `CLAUDE.md`)

## ⭐ Features (screens · functionality · edge cases)
- [[Auth & Account]] · [[Home Dashboard]] · [[Quiz]]
- [[AI Chat]] · [[Credits & Subscriptions]] · [[Gamification]] · [[Study Plans]]
- [[Social]] · [[Notes & Media]]

## 🧭 Start here
- [[Architecture Overview]] — the whole system on one page
- [[Database Schema]] — Prisma models & relations
- [[Navigation & Architecture]] — screen/tab map, navigator tree, safe-area rules, useSystemBars

## 🖥️ Backend
- [[Backend Architecture]] — layering, request lifecycle, conventions
- [[Auth & Token Flow]] — JWT access/refresh, OTP email verification
- Modules:
  - [[Module - Auth & Users]]
  - [[Module - Library (Folders, Sets, Cards)]]
  - [[Module - AI & Credits]]
  - [[Module - Social (Friends, Activities, Notifications)]]
  - [[Module - Media & Notes]]
  - [[Module - Study Plans]]
  - [[Module - Gamification]]
  - [[Module - Subscriptions]]
  - [[Module - Waitlist]]

## 📱 Frontend
- [[Frontend Architecture]] — directory map, conventions
- [[Navigation & Architecture]] — navigators, tabs, stacks, tab icon state, cross-tab patterns
- [[State & Data Fetching]] — Zustand + React Query
- [[Screen Map]] — every screen and its data source
- [[Hooks & API Layer]] — how screens talk to the backend
- [[Theme & Components]] — design tokens + component library
- [[Design Language (Calm Serene)]] — app-wide redesign reference (start here for styling)
- [[Localization (i18n)]] — 6 locales, deterministic completeness scan, translation caveats
- [[Brand & Assets]] — Verdance logo, icons/splash/notification, store + web assets (all from `branding/build-icons.mjs`)

## 🛠️ Ops
- [[Identity & Accounts]] — ⭐ authoritative app name, bundle IDs, Firebase/OAuth accounts
- [[Store Launch (App Store + Play)]] — App Store + Play submission status, reviewer account, screenshots
- [[Local Dev Setup]] — running locally (Postgres 5434)
- [[Deployment (Hetzner)]] — the VPS setup (LIVE at 94.130.176.8; api.getverdance.com)
- [[Migration History]] — Prisma migration timeline & the reconciliation

## Conventions for this vault
- One note per concept/module; link liberally with `[[wikilinks]]`.
- Keep facts anchored to real paths (e.g. `backend/src/modules/ai/`).
- Update the `updated:` date and this hub when structure changes.
- A [graphify](../graphify-out/) knowledge graph also exists — this vault is the
  hand-curated companion to it.
