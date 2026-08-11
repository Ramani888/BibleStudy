# Meditation Project — SVG Icon Inventory

Source: `/Volumes/DevSSD/Work/Meditation/src/shared/components/icons/`

## Icon API

All icons share one type:

```ts
interface IconProps {
  size?: number;    // width & height in px (default 24)
  color?: string;  // stroke or fill color (default indigo #6366F1)
  filled?: boolean; // solid/active variant (only tab-bar icons honor this)
}
```

Implemented with `react-native-svg` (`Svg`, `Path`, etc). Named exports only.

---

## 35 Shared Icons (ready to copy)

| Icon | File | Notes |
|------|------|-------|
| AlertCircle | `AlertCircleIcon.tsx` | Error / warning |
| ArrowLeft | `ArrowLeftIcon.tsx` | Back nav |
| ArrowRight | `ArrowRightIcon.tsx` | Forward nav |
| BarChart | `BarChartIcon.tsx` | Stats / progress |
| Bell | `BellIcon.tsx` | Notifications |
| Calendar | `CalendarIcon.tsx` | Schedule / dates |
| Check | `CheckIcon.tsx` | Completion tick |
| ChevronDown | `ChevronDownIcon.tsx` | Dropdown / collapse |
| ChevronRight | `ChevronRightIcon.tsx` | List row arrow |
| Clock | `ClockIcon.tsx` | Time / duration |
| CloudRain | `CloudRainIcon.tsx` | Ambient sound category |
| Crown | `CrownIcon.tsx` | Premium / subscription |
| FileText | `FileTextIcon.tsx` | Notes / documents |
| Heart | `HeartIcon.tsx` | Favorite toggle (outline + filled) |
| Home | `HomeIcon.tsx` | Tab bar (outline + filled, Iconly Bold active) |
| Info | `InfoIcon.tsx` | Help / tooltip |
| Language | `LanguageIcon.tsx` | Locale / language settings |
| Lock | `LockIcon.tsx` | Locked / premium gated |
| Medal | `MedalIcon.tsx` | Achievement medal |
| MilestoneTrophy | `MilestoneTrophyIcon.tsx` | Milestone unlock |
| Moon | `MoonIcon.tsx` | Dark mode / night session |
| MusicNote | `MusicNoteIcon.tsx` | Sound / audio |
| Pause | `PauseIcon.tsx` | Media control |
| Play | `PlayIcon.tsx` | Media control |
| QuoteMark | `QuoteMarkIcon.tsx` | Daily quote display |
| Settings | `SettingsIcon.tsx` | Settings screen |
| Shield | `ShieldIcon.tsx` | Privacy / security |
| Stop | `StopIcon.tsx` | Media control |
| Streak | `StreakIcon.tsx` | Streak / flame |
| Sun | `SunIcon.tsx` | Light mode / morning session |
| TrophyCup | `TrophyCupIcon.tsx` | Achievement cup variant |
| Trophy | `TrophyIcon.tsx` | Achievement trophy |
| Users | `UsersIcon.tsx` | Friends / social |
| VolumeHigh | `VolumeHighIcon.tsx` | Audio volume |
| VolumeLow | `VolumeLowIcon.tsx` | Audio volume |

---

## 2 Feature-Specific Icons

| Icon | File | Notes |
|------|------|-------|
| ObjectiveIcon | `src/features/meditation/components/ObjectiveIcon.tsx` | Onboarding goal selector |
| SocialIcons | `src/features/meditation/components/invite/SocialIcons.tsx` | Share sheet social logos |

---

## Usage in BibleStudy

Before using, check if `react-native-svg` is already installed:
```bash
cd frontend && grep react-native-svg package.json
```

To copy an icon: copy the `.tsx` file into `frontend/src/components/icons/` and update imports. The `IconProps` type should live in `frontend/src/components/icons/types.ts`.

**Most useful for BibleStudy**: Bell, Calendar, Check, ChevronRight, Clock, Crown, FileText, Heart, Lock, Medal, Settings, Shield, Streak, Trophy, Users

---

## Skill

A `/meditation-icons` skill can scaffold copying specific icons into BibleStudy with correct path + imports. See: [[meditation-parity skill]].
