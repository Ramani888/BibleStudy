# Verdance — Brand System

> A calm, premium home for AI-assisted Bible study. The brand should feel like a
> gilt-edged, leather-bound scripture reimagined for a quiet modern reader —
> **heritage + growth + restraint**.

## Positioning
- **Name meaning:** *verdant* — lush, flourishing green. Faith and understanding
  *growing*. (Psalm 1 "planted by streams", John 15 the vine, the mustard seed.)
- **Promise:** study that deepens, not another noisy app. Calm, considered, premium.
- **Personality:** reverent · elegant · warm · quiet-confident. NOT playful, loud,
  or techy-neon.

## Logo
- **Primary mark:** a slender **"V" that cradles a rising leaf** — the letterform
  and the growth symbol are one shape. Monoline, thin strokes = premium.
- **Emblem lockup:** the mark inside a hairline ring = a crest/seal (luxury cue).
  Use for the app icon and favicons.
- **Wordmark:** `VERDANCE` in a high-contrast serif, widely letter-spaced.
- **Clear space:** keep whitespace ≥ the height of the "V" around the mark. Luxury
  lives in the margins — never crowd it.
- **Don'ts:** no drop shadows on the mark, no gradients other than the gold foil,
  no more than 2 colors in the mark, never stretch or rotate.

## Color
Deep, jewel-toned, with a metallic accent. Emerald = growth; gold = scripture/heritage.

| Token | Hex | Use |
|-------|-----|-----|
Pulled directly from the app theme (`frontend/src/theme/palette.ts` + `colors.ts`)
so the brand and the product are one system.

| Token | Hex | Use |
|-------|-----|-----|
| Violet 500 | `#8B5CF6` | brand gradient start / icon field top-left |
| Indigo 500 | `#6366F1` | brand gradient end / accent (app `accent`) |
| Indigo 800 | `#30208F` | deep indigo, high-contrast headings |
| Violet 400 | `#A78BFA` | soft accent, highlights |
| Accent Soft | `#EEF0FF` | tint fields, the mark's lower stop |
| Background | `#FCF8FF` | app light-mode canvas |
| White | `#FFFFFF` | the mark on the gradient tile |
| Ink 900 | `#0F1117` | near-black text |

**Brand gradient:** `#8B5CF6 → #6366F1` (violet500 → indigo500, top-left → bottom-right).
This is the app's own `gradientStart → gradientEnd` — the logo *is* the theme.
The mark sits in **white → `#EEF0FF`** on the gradient (WhatsApp/Twitter "symbol on
brand-color" pattern).

## Typography
- **Display / wordmark:** a high-contrast serif — **Cormorant Garamond** or
  **Playfair Display** (both free, Google Fonts). Widely letter-spaced, light weight.
  This carries the entire luxury feel — do not skip it.
- **UI / body:** a clean humanist sans — **Inter** or the app's current sans.
  Serif for brand moments, sans for readable app text.
- **Pairing rule:** serif ONLY for headlines/brand; never set paragraphs in the serif.

## Voice
- Warm, unhurried, literate. Short sentences. No hype, no exclamation storms.
- "Grow in the Word." / "Study, deepened." — not "🔥 Crush your Bible goals!"

## Assets to produce (launch)
- [ ] App icon (iOS `AppIcon.appiconset` + Android adaptive) from the emblem.
- [ ] Splash screen (mark + wordmark, centered, ink-emerald field).
- [ ] Wordmark in outlines (SVG/PNG) for store header + website.
- [ ] Favicon / social share (OG) image.
- [ ] Paywall hero using gold accents (premium = justifies the price).
