---
tags: [frontend, design, redesign]
updated: 2026-08-07
---

# Design Language — Calm / Serene

The single reference for the app-wide redesign. Every module we polish follows
**this** doc, so the whole app feels like one product — not 16 screens each
styled on a different day. Companion to [[Theme & Components]].

Palette: **indigo #6366F1 primary + violet #A78BFA**, full light/dark via `theme/useTheme()` + `theme/themeStore.ts`.

Mood: **calm + serene** (indigo/violet palette, light + dark modes, airy whitespace).

---

## The two reference apps & what we steal

### Calm / Headspace (meditation)
How they use style app-wide:
- **One focus per screen.** A screen shows ONE hero thing + lots of empty space.
  Never 6 competing boxes. This is the biggest lever.
- **Whitespace is the design.** Generous padding, big gaps between sections.
  Air = calm.
- **Soft, low-contrast surfaces.** Gentle gradients, faint borders, soft
  shadows — nothing sharp or boxy.
- **Slow, gentle motion.** Fades and springs that *settle*, never bounce hard.
- **Restrained color.** One warm accent, used sparingly. Color means "this is
  important," so most of the screen is neutral.

### YouVersion / Scripture Typer (Bible memory)
- **Verse is the hero.** Scripture rendered large, in an elegant **serif**, with
  breathing room. The word of God is never a caption.
- **Daily-verse + streak as the emotional hook** on the home surface.
- **Memorization mechanics are the product:** progressive blanking, first-letter
  hints, typing recall, spaced-repetition streaks → these already map to our
  quiz modes.

**Our blend:** Calm's air & one-focus layout + YouVersion's serif-verse hero +
streak hook. We already own the pieces (`DailyVerseCard`, quiz streaks).

---

## App-wide rules (apply to every screen)

### 1. One hero per screen
Each screen has a single primary element. Everything else is quieter and
smaller. If two things fight for attention, one loses (shrink it, move it, or
cut it).

### 2. Whitespace rhythm
Use the `spacing` scale as a rhythm, not random numbers:
- Between major sections: **`spacing[6]`** (min).
- Card internal padding: **`spacing[5]`–`spacing[6]`**.
- Hero cards: **`spacing[6]`**, radius **18**.
- Tight groups (icon+label, chip internals): `spacing[1]`–`spacing[2]`.

### 3. Verse / scripture typography
Always the `verse` preset (`typography.ts`) — system serif (Georgia iOS /
serif Android), relaxed line-height, italic. Never render scripture with a
body/sans preset.

### 4. Soft surfaces
- Card radius **14–18** (was 12; softer).
- Borders: prefer **`colors.border` at low weight** or none + a soft shadow.
  Avoid hard 1px boxes stacked next to each other.
- Gradients: gentle, cohesive (adjacent palette steps), never a light→very-dark
  jump. Hero gradient = adjacent indigo/violet steps.

### 5. Color discipline
- **Indigo = the one accent.** Use for the single primary action / hero only.
- Semantic colors (info/warning/success) only for their meaning, not decoration.
- Most surfaces neutral: `background`, `backgroundSecondary`, `textSecondary`.

### 6. Calm motion
- Entrance: `FadeInDown` staggered ~80ms, `.springify()` with soft damping.
- No hard bounces. Value-change pops stay subtle (scale ≤1.08).

### 7. State completeness (non-negotiable)
Every data surface handles **loading / empty / error** with the shared
`feedback/` components — a serene screen still has to degrade gracefully.

---

## Per-pattern quick spec

| Element | Rule |
|--------|------|
| Screen header | Greeting/title + at most ONE trailing action. No badge pileup. |
| Section title | `h4`, `spacing[3]` below, `spacing[6]` above the block. |
| Hero card | radius 18, padding `spacing[6]`, soft gradient, serif if verse. |
| Content card | radius 14, padding `spacing[4]`, faint border OR soft shadow (not both). |
| Chips / stats | quiet fill (`backgroundSecondary`), no hard border, subtle. |
| Primary button | indigo accent, one per screen. Secondary = ghost/outline. |
| Empty state | icon + one calm sentence + one action. Lots of padding. |

---

## Per-module redesign checklist

Run this on each module as we go (tick in that module's note):

- [ ] One clear hero; everything else quieter.
- [ ] Section gaps ≥ `spacing[6]`; card padding ≥ `spacing[5]`.
- [ ] Scripture uses the `verse` preset.
- [ ] Radii 14–18; no stacked hard borders.
- [ ] Indigo accent used only for the single primary action / hero.
- [ ] loading / empty / error all present via `feedback/` components.
- [ ] Entrance motion is a soft staggered `FadeInDown`.
- [ ] No duplicate data on screen (e.g. streak shown once).
- [ ] Device-tested on the physical iPhone.

---

## Progress

| Module | Status |
|--------|--------|
| Home | 🟢 done — indigo theme, tracker-style layout, quick-actions, streak, verse card. Not device-tested. |
| Library | 🟢 done — all 9 screens, Screen/ScreenHeader/makeStyles, SVG icons, ListCard/AccentIcon, Header→Body→Footer. Not device-tested. |
| AI | 🟢 done — dark-mode aware, consistent header/icons. |
| Profile + social | 🟢 done — all 24 screens, Fiverr-inspired ProfileScreen, full makeStyles, 15 new SVG icons. |
| Quiz | 🟢 done — fully restructured (2026-08-06): new flow Hub→Setup→Quiz→Summary/Detail. Theme audit clean (2026-08-07, commit `747885b`). Not device-tested. |
| Auth | 🟢 done — AuthLayout dark-mode aware (useTheme+makeStyles), SparklesIcon SVG, all 5 screens use useTheme(). Not device-tested. |
| Onboarding | 🟢 done — Ionicons replaced with SVG (BookIcon/LibraryIcon/SparklesIcon), makeStyles, dark-mode aware. Not device-tested. |
