-- Drop the legacy "File" table / "FileType" enum left over from the init
-- migration. Media is now handled by the "MediaFile" table (see add_media_files);
-- no application code references "File". This completes the schema<->migration
-- reconciliation, leaving zero drift.

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_folderId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_userId_fkey";

-- DropTable
DROP TABLE "File";

-- DropEnum
DROP TYPE "FileType";
