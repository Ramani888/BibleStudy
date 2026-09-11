---
tags: [frontend, marketing, landing, ops]
---

# Landing Page (getverdance.com)

> ✅ **LIVE on https://getverdance.com/** since 2026-09-11. Single self-contained
> static file — no framework, no build step.

## What / where
- One file: **`legal/index.html`** (in the app repo). Deployed by copying to the Hetzner
  box; Caddy `file_server` serves it. See [[Deployment (Hetzner)]].
- Palette: violet500 `#8B5CF6` → indigo500 `#6366F1`, gold accent `#C9A227`, **Inter** type.
- Sections: hero → **ask marquee** → features (bento) → remember-more (split) → together
  (split + stats) → phone fan → mission (dark) → pricing → FAQ → CTA band → footer.
- Screenshots in `legal/screens/` (Android 720×1600 in hole-punch frames).
- Support contact (footer): **ddtechservices.work@gmail.com**.

## Motion system
The page has **no animation library of its own** — it lazy-loads **GSAP + ScrollTrigger**
from a CDN as progressive enhancement, plus vanilla CSS keyframes + `IntersectionObserver`.
Everything degrades cleanly under `prefers-reduced-motion` and a `no-js` fallback.

**Already there (original build `a60a1c0`):** hero words rise+fade (GSAP stagger), aurora
blob parallax, `.reveal` scroll reveals, **pin-and-scrub sticky reveal** of the
spaced-repetition checklist, frosted **blur-on-scroll nav**, spotlight cards (cursor glow),
magnetic buttons + CTA shine sweep, hero-phone 3D tilt, count-up stats, native `<details>`
FAQ, scroll-progress bar, scroll-spy nav, back-to-top, full-height mobile menu.

**Peekly-inspired additions (2026-09-11, merge `5155520`)** — teardown of https://peekly.app:
1. **Ambient aurora drift** — whole glow field self-drifts (`auroraDrift` 26s); GSAP still
   scrubs the individual blobs on scroll (no conflict — container vs. children).
2. **Float-bob** on the hero streak/due cards (`floatBob`, out of phase).
3. **Gradient shine** on the "Word." hero highlight (background-clip:text + `wordShine`).
4. **Footer glow band** (soft violet radial above the footer).
5. **"Ask" marquee** — slow edge-faded strip of honest example prompts ("Context of
   Philippians 4:13?", "Make 5 cards on Romans 8", …), pause-on-hover, seamless two-half
   `-50%` loop, duplicate half `aria-hidden`. Deliberately calm (not Peekly's punchy energy).
- **Mobile-menu labels:** dropped the oversized `clamp(…32px)` → **fixed 17px** (iOS row
  size; Peekly's own menu measured 14–15.5px), arrows 16px. The `vw`-clamp was why it grew
  on larger phones.

## Deploy (no build, no rebuild)
Only `index.html` changed in the animation pass — copy just that file; the whole-folder
form (below) is only needed when `screens/`, `sitemap.xml`, or `robots.txt` change too.
```bash
# single-file update (typical):
scp legal/index.html root@94.130.176.8:/var/www/getverdance/index.html
# full first-time / when assets change:
scp -r legal/index.html legal/robots.txt legal/sitemap.xml legal/screens root@94.130.176.8:/var/www/getverdance/
```
Verify: `curl -s https://getverdance.com/ | grep ask-band` returns a hit.
Preview locally: `cd legal && python3 -m http.server 8799` → `http://localhost:8799/`
(`file://` is blocked in the browser tooling).

## See also
- [[Deployment (Hetzner)]] · [[Brand & Assets]] · [[Store Launch (App Store + Play)]]
