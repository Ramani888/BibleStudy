BibleStudyPro — Library Module: Gap Analysis & Architecture Report                                                                               
                                                                                                                                                   
  What I Analyzed                                                                                                                                  
                                                                                                                                                   
  - 16 reference app screenshots (folders, sets, cards — all screens + action menus)
  - All current frontend screens: LibraryScreen, SetDetailScreen, FolderDetailScreen, CreateCard, CreateSet, EditCard, EditSet
  - All hooks: useFolders, useSets, useCards
  - All API layers: folders.api, sets.api, cards.api
  - Backend services + Prisma schema

  ---
  Section 1: What the Images Require (Target State)

  Library Screen (Main)

  ┌───────────────┬───────────────────────────────────────────────────────────────────────────┐
  │    Element    │                              Target (images)                              │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Header        │ Icon row: toggle, profile, notes, folder, search                          │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Navigation    │ SETS / FOLDERS tab toggle (not separate sections)                         │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ SETS tab      │ Flat vertical list: color left-bar, name, card count icon, ⋮ menu per row │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ FOLDERS tab   │ Flat vertical list: color left-bar, name, set count, ⋮ menu per row       │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Create button │ Full-width bottom sticky button ("CREATE SET" or "CREATE FOLDER")         │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Empty state   │ "Folder not found" / no sets message centered                             │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ Search        │ Behind the search icon (not a persistent input bar)                       │
  └───────────────┴───────────────────────────────────────────────────────────────────────────┘

  Create Folder

  ┌───────────────┬─────────────────────────────────────────────────┐
  │    Element    │                     Target                      │
  ├───────────────┼─────────────────────────────────────────────────┤
  │ UI type       │ Bottom sheet (not a modal)                      │
  ├───────────────┼─────────────────────────────────────────────────┤
  │ Fields        │ Folder name + color picker (12 preset colors)   │
  ├───────────────┼─────────────────────────────────────────────────┤
  │ Color preview │ Two pills: solid left-bar style + gradient pill │
  ├───────────────┼─────────────────────────────────────────────────┤
  │ Submit        │ "DONE" button                                   │
  └───────────────┴─────────────────────────────────────────────────┘

  Set Action Menu (⋮ per row in SETS tab)

  + CREATE CARD
  ⊕ Assign Folder
  ✏️  Edit Set
  🗑️  Delete Set  ← red

  Folder Action Menu (⋮ per row in FOLDERS tab)

  + CREATE SET
  ✏️  EDIT FOLDER
  🗑️  Delete Folder  ← red

  Set Detail Screen

  ┌──────────────┬──────────────────────────────────────────────────────────────────┐
  │   Element    │                              Target                              │
  ├──────────────┼──────────────────────────────────────────────────────────────────┤
  │ Background   │ Dark teal (primary color)                                        │
  ├──────────────┼──────────────────────────────────────────────────────────────────┤
  │ Header       │ ← back                                                           │
  ├──────────────┼──────────────────────────────────────────────────────────────────┤
  │ Card row     │ Top section (gray/lighter) = question + ℹ️  + 👁️  + ⋮ icons        │
  ├──────────────┼──────────────────────────────────────────────────────────────────┤
  │ Card row     │ Bottom section (white) = answer text                             │
  ├──────────────┼──────────────────────────────────────────────────────────────────┤
  │ Blur state   │ Bottom section blurred when isBlurred = true; 👁️  icon toggles it │
  ├──────────────┼──────────────────────────────────────────────────────────────────┤
  │ Note state   │ ℹ️  icon opens popup: "None" + "+ Add Note"                       │
  ├──────────────┼──────────────────────────────────────────────────────────────────┤
  │ No study FAB │ Cards listed; study is in the Study tab                          │
  ├──────────────┼──────────────────────────────────────────────────────────────────┤
  │ Layout       │ Full-width (default) or 2-column grid — toggled via ⋮ menu       │
  └──────────────┴──────────────────────────────────────────────────────────────────┘

  Set Detail — Header ⋮ menu

  Change Order
  Blur
  + CREATE CARD
  Layout

  Card Action Menu (⋮ per card)

  ✏️  Edit
  🗑️  Delete  ← red
  📋 Copy
  ↩️  Move

  Create Card Screen

  ┌──────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │   Element    │                                                  Target                                                  │
  ├──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Header       │ ←                                                                                                        │
  ├──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Card preview │ Flashcard visual with + icon at top                                                                      │
  ├──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Fields       │ "Top" (single line = question), "Bottom" (multiline = answer), "Notes" toggle → reveals "Note" multiline │
  ├──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Submit       │ "DONE" button                                                                                            │
  └──────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ---
  Section 2: Current State vs Target — Gap Table

  Library Screen

  ┌────────────────┬──────────────────────────────────────────┬─────────────────────────────────────────────┬──────────────────────────────────┐
  │    Feature     │                 Current                  │                   Target                    │               Gap                │
  ├────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────┤
  │ Header         │ "Library" text + "Browse Public" link    │ Icon row                                    │ Redesign needed                  │
  ├────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────┤
  │ Layout         │ Folders horizontal scroll + Sets         │ SETS/FOLDERS tab toggle                     │ Full redesign                    │
  │                │ vertical                                 │                                             │                                  │
  ├────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────┤
  │ Folder display │ Horizontal scroll cards                  │ Flat vertical list with color bar           │ Full redesign                    │
  ├────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────┤
  │ Set display    │ Vertical SetCard component               │ Flat row with color bar + count + ⋮         │ Full redesign                    │
  ├────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────┤
  │ Create entry   │ FAB (+) opens ActionSheet                │ Bottom sticky button                        │ Redesign                         │
  ├────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────┤
  │ Search         │ Persistent Input below header            │ Behind search icon                          │ Move                             │
  ├────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────┤
  │ Set ⋮ actions  │ Long press only: Edit, Add Cards, Clone, │ Per-row ⋮: Create Card, Assign Folder,      │ Missing: Assign Folder. Clone    │
  │                │  Delete                                  │ Edit, Delete                                │ removed.                         │
  ├────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────┤
  │ Folder ⋮       │ Long press only: Delete                  │ Per-row ⋮: Create Set, Edit Folder, Delete  │ Missing: Create Set, Edit Folder │
  │ actions        │                                          │                                             │                                  │
  └────────────────┴──────────────────────────────────────────┴─────────────────────────────────────────────┴──────────────────────────────────┘

  Create Folder

  ┌─────────┬──────────────────────┬─────────────────────┬────────────────────────┐
  │ Feature │       Current        │       Target        │          Gap           │
  ├─────────┼──────────────────────┼─────────────────────┼────────────────────────┤
  │ UI type │ AppModal             │ Bottom sheet        │ Redesign               │
  ├─────────┼──────────────────────┼─────────────────────┼────────────────────────┤
  │ Fields  │ Name only            │ Name + color picker │ Missing color picker   │
  ├─────────┼──────────────────────┼─────────────────────┼────────────────────────┤
  │ Color   │ Not supported at all │ 12 preset colors    │ Missing in DB, API, UI │
  └─────────┴──────────────────────┴─────────────────────┴────────────────────────┘

  Set Detail Screen

  ┌──────────────────────┬─────────────────────────────────────────────┬─────────────────────────────────────────┬──────────────────────────┐
  │       Feature        │                   Current                   │                 Target                  │           Gap            │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Background           │ White (colors.background)                   │ Dark teal (colors.primary)              │ Style change             │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Card display         │ Q/A with DifficultyBadge, long-press action │ Top/Bottom two-section, per-card icons  │ Full redesign            │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Per-card blur toggle │ Not in UI (isBlurred exists in DB)          │ 👁️  icon toggles isBlurred               │ Missing UI               │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Per-card note        │ Not in DB or UI                             │ ℹ️  icon shows/edits note                │ Missing in DB + API + UI │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Card actions         │ Long press: Edit, Delete                    │ ⋮ menu: Edit, Delete, Copy, Move        │ Missing Copy, Move       │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Header ⋮ menu        │ None                                        │ Change Order, Blur, Create Card, Layout │ Fully missing            │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Layout switcher      │ CardLayout exists in DB but no UI           │ Full-width / 2-column grid              │ Missing UI               │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Reorder UI           │ Hook exists (useReorderCards) but no UI     │ "Change Order" drag mode                │ Missing UI               │
  ├──────────────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────┤
  │ Study FAB            │ Present (Study N Cards button)              │ Absent (study is Study tab)             │ Remove                   │
  └──────────────────────┴─────────────────────────────────────────────┴─────────────────────────────────────────┴──────────────────────────┘

  Create Card Screen

  ┌─────────────┬───────────────────────────────────────────┬──────────────────────────────┬──────────────────────────────────────────────────┐
  │   Feature   │                  Current                  │            Target            │                       Gap                        │
  ├─────────────┼───────────────────────────────────────────┼──────────────────────────────┼──────────────────────────────────────────────────┤
  │ Fields      │ Question + Answer + isBlurred +           │ Top + Bottom + Notes         │ Rename fields, add Note, remove difficulty       │
  │             │ difficulty                                │ (toggle)                     │ picker                                           │
  ├─────────────┼───────────────────────────────────────────┼──────────────────────────────┼──────────────────────────────────────────────────┤
  │ Card        │ None                                      │ Flashcard visual at top      │ Missing visual                                   │
  │ preview     │                                           │                              │                                                  │
  ├─────────────┼───────────────────────────────────────────┼──────────────────────────────┼──────────────────────────────────────────────────┤
  │ Note field  │ None                                      │ Expandable via "Notes"       │ Missing                                          │
  │             │                                           │ button                       │                                                  │
  └─────────────┴───────────────────────────────────────────┴──────────────────────────────┴──────────────────────────────────────────────────┘

  ---
  Section 3: Database Schema Gaps

  Two fields are missing from the Prisma schema:

  model Folder {
    // MISSING:
    color  String?   // e.g. "#7C3AED" — the colored left-bar per folder
  }

  model Card {
    // MISSING:
    note   String?   // per-card note, shown via ℹ️  icon
  }

  This requires a new migration before any frontend work on these features.

  ---
  Section 4: Backend API Gaps

  ┌───────────────────────┬─────────────────────────────────────────────────────────────────────────┐
  │          Gap          │                               Description                               │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ POST /folders         │ Needs to accept color field                                             │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ PUT /folders/:id      │ Needs to accept color field                                             │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ POST /cards           │ Needs to accept note field                                              │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ PUT /cards/:id        │ Needs to accept note field                                              │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ POST /cards/:id/copy  │ MISSING — copy card to same set                                         │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ PATCH /cards/:id/move │ MISSING — move card to different set                                    │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ PATCH /cards/:id/blur │ Can use existing PUT update, but a dedicated toggle endpoint is cleaner │
  └───────────────────────┴─────────────────────────────────────────────────────────────────────────┘

  ---
  Section 5: Frontend API Layer Gaps

  ┌─────────────────┬────────────────────────────────────────────────────────────────────────────┐
  │      File       │                                    Gap                                     │
  ├─────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ folder.types.ts │ Missing color?: string on Folder, CreateFolderPayload, UpdateFolderPayload │
  ├─────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ card.types.ts   │ Missing note?: string on Card, CreateCardPayload, UpdateCardPayload        │
  ├─────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ cards.api.ts    │ Missing copy(id) and move(id, targetSetId) functions                       │
  └─────────────────┴────────────────────────────────────────────────────────────────────────────┘

  ---
  Section 6: Frontend Hook Gaps

  ┌──────────────────────────┬──────────────────────────────────────────────────────────┐
  │       Missing Hook       │                         Purpose                          │
  ├──────────────────────────┼──────────────────────────────────────────────────────────┤
  │ useCopyCard()            │ POST /cards/:id/copy                                     │
  ├──────────────────────────┼──────────────────────────────────────────────────────────┤
  │ useMoveCard()            │ PATCH /cards/:id/move                                    │
  ├──────────────────────────┼──────────────────────────────────────────────────────────┤
  │ useToggleCardBlur(setId) │ Thin wrapper around useUpdateCard for isBlurred toggle   │
  ├──────────────────────────┼──────────────────────────────────────────────────────────┤
  │ useAssignFolder()        │ Thin wrapper around useUpdateSet for folderId assignment │
  └──────────────────────────┴──────────────────────────────────────────────────────────┘

  ---
  Section 7: Architecture Problems (Duplication + Dead Code)

  7.1 Duplicated set action logic

  LibraryScreen and FolderDetailScreen both call useDeleteSet, useCloneSet, build Alert dialogs, and show Toasts for the exact same mutations. This
   is ~40 lines of identical logic in two files.
  Fix: Extract a single useSetActions(navigation) hook.

  7.2 Over-fetching in LibraryScreen

  LibraryScreen calls useSets() (all sets, no filter) and then does client-side filtering via setCountByFolder. FolderDetailScreen calls
  useSets(folderId) for filtered sets. These hit different query keys, causing two separate backend calls when one would do.
  Fix: The library redesign (SETS/FOLDERS tabs) actually fixes this naturally — SETS tab uses all sets, FOLDERS tab shows folder list only.

  7.3 Dead nested-folder tree logic in backend

  listFolders service builds a rootFolders tree with children arrays. The frontend Folder type has no children field and the UI never renders
  nested folders. This dead code runs on every folder fetch.
  Fix: Remove the tree-building loop. Return flat array ordered by createdAt.

  7.4 Backend getFolderById over-fetches

  Includes sets, notes, files in the Prisma include — but the frontend Folder type doesn't have these fields and no screen uses them.
  Fix: Remove notes and files from the include. Sets are fetched separately via useSets(folderId).

  7.5 Query key inconsistency

  - useSets() → key ['sets', { folderId: undefined }]
  - useSets(folderId) → key ['sets', { folderId }]
  - useDeleteSet, useCloneSet invalidate ['sets'] (parent prefix)

  This works but is fragile. A mutation that invalidates ['sets'] will re-fetch all set queries simultaneously.
  Fix: Keep as-is for now (prefix invalidation is an intentional React Query pattern), but document it.

  7.6 EditFolder screen is missing entirely

  useUpdateFolder(id) hook is implemented and wired correctly. But there is no EditFolderScreen and no route for it in the navigator. The images
  show "EDIT FOLDER" in the folder action menu.
  Fix: Create EditFolderScreen (or reuse a bottom sheet pattern) and add the route.

  7.7 Card userId is nullable in schema but always set in practice

  Card.userId String? — nullable by DB design, but createCard always sets it from req.user.id. The nullable allows orphaned cards (e.g. if a user
  is deleted with onDelete: SetNull). This is intentional but confusing.
  Fix: No change needed — it's correct by design (card survives user deletion). Just document it.

  7.8 FolderCard component is not used the way the images show

  The current FolderCard renders a horizontal scroll card. The images show folders as vertical list rows with a color bar on the left. The
  component needs to be redesigned or a new FolderRow component created.

  ---
  Section 8: Proposed Execution Phases

  Phase 1 — Database (1 migration, backend only)

  1. Add color String? to Folder
  2. Add note String? to Card
  3. Run prisma migrate dev

  Phase 2 — Backend API Updates

  1. Update CreateFolderDto + UpdateFolderDto to include color
  2. Update folder service createFolder/updateFolder to write color
  3. Update CreateCardDto + UpdateCardDto to include note
  4. Update card service createCard/updateCard to write note
  5. Add POST /cards/:id/copy route + controller + service
  6. Add PATCH /cards/:id/move route + controller + service (accepts targetSetId)
  7. Remove dead tree-building logic from listFolders
  8. Remove over-fetched notes/files from getFolderById

  Phase 3 — Frontend Types + API Layer

  1. Add color to Folder, CreateFolderPayload, UpdateFolderPayload
  2. Add note to Card, CreateCardPayload, UpdateCardPayload
  3. Add copy and move to cardsApi

  Phase 4 — Frontend Hooks

  1. Add useCopyCard(), useMoveCard()
  2. Add useToggleCardBlur(setId)
  3. Extract useSetActions(navigation) shared hook

  Phase 5 — Library Screen Redesign (Biggest change)

  1. SETS/FOLDERS tab toggle header
  2. SETS tab: flat list rows with color bar + count + ⋮ inline menu
  3. FOLDERS tab: flat list rows with color bar + ⋮ inline menu
  4. Bottom sticky buttons
  5. Search moved behind icon

  Phase 6 — Create Folder → Bottom Sheet + Color Picker

  1. Replace AppModal with bottom sheet
  2. Add 12-color color picker component
  3. Wire color to API

  Phase 7 — Set Detail Screen Redesign

  1. Dark teal background
  2. New two-section card row (Top gray + Bottom white)
  3. Per-card: ℹ️  note popup, 👁️  blur toggle, ⋮ actions
  4. Header ⋮ menu (Change Order, Blur, Create Card, Layout)
  5. Grid/full-width layout switcher

  Phase 8 — Card Actions

  1. Copy card
  2. Move card (set picker)
  3. Per-card blur toggle UI
  4. Per-card note UI (add/edit note in popup)

  Phase 9 — Edit Folder

  1. Create EditFolderScreen or bottom sheet
  2. Add route to navigator
  3. Wire from folder ⋮ menu

  Phase 10 — Create Card Screen Polish

  1. Add card preview visual at top
  2. Rename Question→Top, Answer→Bottom
  3. Add Notes toggle → reveals note field

  ---
  Questions for You Before We Start

  2. Move card (set picker)
  3. Per-card blur toggle UI
  4. Per-card note UI (add/edit note in popup)

  Phase 9 — Edit Folder

  1. Create EditFolderScreen or bottom sheet
  2. Add route to navigator
  3. Wire from folder ⋮ menu

  Phase 10 — Create Card Screen Polish

  1. Add card preview visual at top
  2. Rename Question→Top, Answer→Bottom
  3. Add Notes toggle → reveals note field