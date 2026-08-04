-- Redefine "Note": the legacy shape from the init migration
-- (content / folderId / verseReference) is replaced by the new note design
-- (body, user-owned only). The table, its userId FK (init) and userId index
-- (add_otp migration) already exist, so we transform in place instead of
-- re-creating them.

-- Drop legacy folder association (FK + index) if present
ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_folderId_fkey";
DROP INDEX IF EXISTS "Note_folderId_idx";

-- Drop legacy columns
ALTER TABLE "Note" DROP COLUMN IF EXISTS "folderId";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "verseReference";

-- Rename "content" -> "body" (preserves existing note text)
ALTER TABLE "Note" RENAME COLUMN "content" TO "body";
