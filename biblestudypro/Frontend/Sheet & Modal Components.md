---
tags: [frontend, components]
---

# Sheet & Modal Components

Three distinct overlay primitives in `components/feedback/`. Pick the right one — they are **not interchangeable**.

## Primitives

| Component | File | Underlying | Use for |
|-----------|------|------------|---------|
| `ActionSheet` | `feedback/ActionSheet.tsx` | `@gorhom/bottom-sheet` `BottomSheetModal` | Action menus — list of tappable actions with icons, destructive styling, Cancel button |
| `AppModal` | `feedback/Modal.tsx` | RN `<Modal>` | Dialogs, forms, confirmations — anything that needs a centred overlay |
| `SelectSheet` | `feedback/SelectSheet.tsx` | wraps `AppModal` | Searchable "pick one from a list" flows (move to folder, assign, choose) |

> `SelectSheet` is **not** a bottom sheet — it renders inside `AppModal`.

---

## Where each is used

### `ActionSheet`
| Screen | Purpose |
|--------|---------|
| `screens/quiz/QuizHubScreen` | Set actions (edit, delete, start) |
| `screens/library/LibraryScreen` | Set + folder actions |
| `screens/library/SetDetailScreen` | Card-level actions |
| `screens/library/FriendsSetsScreen` | Friend set actions |
| `screens/library/PublicSetsScreen` | Public set actions |
| `screens/ai/AIChatScreen` | Chat session actions |

### `AppModal`
| Screen / Component | Purpose |
|--------------------|---------|
| `screens/quiz/QuizSetupScreen` | Quiz config dialog |
| `screens/library/LibraryScreen` | Create/edit folder or set |
| `screens/library/SetDetailScreen` | Edit set details |
| `screens/library/components/SetForm` | Set create/edit form |
| `screens/ai/components/CardProposalSheet` | AI card proposal review |

### `SelectSheet`
| Screen | Purpose |
|--------|---------|
| `screens/library/LibraryScreen` | Move set to folder |
| `screens/library/SetDetailScreen` | Assign folder / move cards |
| `screens/library/FolderDetailScreen` | Move set out of folder |

---

## Decision rule

- User taps ••• / long-press → **`ActionSheet`**
- User picks one item from a searchable list → **`SelectSheet`**
- Anything else (form, confirm, dialog) → **`AppModal`**
