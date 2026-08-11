# Meditation Screen Parity

Goal: copy each Meditation project screen's visual/layout pattern into the equivalent BibleStudy screen.

## Mapping Table

| Meditation Screen | BibleStudy Screen | Status | Pattern to Apply |
|---|---|---|---|
| ProfileScreen (gradient card) | ProfileScreen | ✅ Done | Gradient card + stats row + MenuSection/MenuItem |
| MilestonesScreen | AchievementsScreen | ✅ Done | Solid indigo header (borderRadius 40 bottom) + frosted trophy circle + progress dots + individual bordered cards + status badges (green/amber/gray) |
| SettingsScreen | SettingsScreen | ✅ Done (MenuSection = SettingsGroup, MenuItem = SettingsRow) | Groups + rows with icon tiles |
| NotificationsScreen | NotificationSettingsScreen | ✅ Done | Separate `PreferenceCard` rows with `gap: spacing.lg` (not a single card with dividers). Each row: title + subtitle + Switch on right |
| SubscriptionScreen | PaywallScreen | ✅ Done | Hero text (brand label + bold title + italic tagline) + selectable PlanCards + feature rows + CTA + fine print + restore link |
| FavoritesScreen | NotesScreen | ✅ Done | `CARD_FILL_LIGHT`/`chipIdle` cards + `CARD_SHADOW` + `gap: spacing.lg` |
| FavoritesScreen | MediaScreen | ✅ Done | Same as NotesScreen pattern (PDF cards) |
| InviteFriendsScreen | FriendsScreen | ✅ Done | `CARD_FILL_LIGHT`/`chipIdle` cards + `CARD_SHADOW` + `gap: spacing.lg` + `radius.md` |
| HomeScreen | HomeScreen | ✅ Already solid | Already has sticky header + hero card + streak + sections. No meaningful new pattern to copy |
| StatesScreen | CreditsScreen | 🔲 Low priority | 2×2 stat tile grid above transaction list |

## Key Style Constants (from Meditation)

```
CARD_SHADOW = { shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }
AMBER       = '#F79009'     // in-progress badge color
AMBER_SOFT  = 'rgba(247,144,9,0.15)'
indigo header borderBottomLeftRadius/Right = 40
trophyBadge = 72×72, borderRadius: radius.r45, bg: rgba(255,255,255,0.15)
dot segments: height:6, borderRadius: radius.r3, filled=white, empty=rgba(255,255,255,0.25)
PreferenceCard gap: spacing.lg (between cards, NOT dividers inside one card)
```

## AchievementsScreen Pattern (reference — already done)

- Full `View` root (not `Screen`), `StatusBar barStyle="light-content"`
- `useSafeAreaInsets()` for paddingTop + paddingBottom
- Solid `palette.indigo500` header, `borderBottomLeftRadius/Right: 40`, `paddingBottom: spacing.xl`
- Header row: back `<BackIcon>` (Pressable) + title
- Trophy badge row: 72×72 frosted circle + bold unlocked count + "N remaining"
- Progress dots: one per achievement, `flex:1` width each, `height:6`
- ScrollView with `paddingTop: spacing.xl`
- Category sections via `View style={styles.section}` + uppercase label
- Individual `<AchievementCard>` per item: `borderRadius: radius.md, borderWidth:1, padding: spacing.lg, CARD_SHADOW`
- Card top row: icon (28px) + title (flex:1) + `<StatusBadge>`
- Status badge: `height:24, borderRadius: radius.sm, paddingHorizontal: spacing.s10`
- Locked cards: `opacity: 0.6`
- Progress bar: `height:4, borderRadius: radius.r2, sliderTrack/sliderFill colors`
