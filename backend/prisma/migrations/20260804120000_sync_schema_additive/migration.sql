-- Reconcile migration history with schema.prisma (additive changes only).
-- NOTE: the legacy "File" table / "FileType" enum are intentionally NOT dropped
-- here. Dropping them is destructive (may hold legacy media rows on remote) and
-- is handled by a separate, later migration once remote data is confirmed empty.

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'CREATED_CARD';

-- AlterTable
ALTER TABLE "AIChat" ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "suggestedCards" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "storageLimit" SET DEFAULT 262144000;

-- CreateTable
CREATE TABLE "AIChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIChatSession_userId_idx" ON "AIChatSession"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_chatId_key" ON "Bookmark"("userId", "chatId");

-- CreateIndex
CREATE INDEX "AIChat_sessionId_idx" ON "AIChat"("sessionId");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE INDEX "Folder_parentId_idx" ON "Folder"("parentId");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChatSession" ADD CONSTRAINT "AIChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AIChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
