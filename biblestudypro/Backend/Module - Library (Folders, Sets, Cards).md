---
tags: [backend, module, study]
---

# Module — Library (Folders, Sets, Cards)

The study core. Paths: `backend/src/modules/{folders,sets,cards}/`.
Mounted at `/api/v1/folders`, `/api/v1/sets`, `/api/v1/cards`.

## Hierarchy
```
Folder (nestable via parentId)
  └── Set (visibility: private/public/…; color)
        └── Card (layout, difficulty, optional note)
```
Models & relations: [[Database Schema]].

## folders
CRUD for folders; **nested folders** via self-referential `parentId`
(cascade delete). Colors for UI grouping.

## sets
CRUD for flashcard sets; visibility controls (private / public / friends);
public discovery feeds the PublicSets & FriendsSets screens.

## cards
CRUD for cards within a set; layout + difficulty metadata; per-card `note`.
Creating a card can emit a `CREATED_CARD` [[Module - Social (Friends, Groups, Gatherings, Map)|Activity]].

## Client
- Hooks: `useFolders`, `useSets`, `useCards`, `useSetStats` — see [[Hooks & API Layer]].
- Screens: Library, FolderDetail, SetDetail, Create/Edit Set, Create/Edit Card,
  PublicSets, FriendsSets — see [[Screen Map]].
