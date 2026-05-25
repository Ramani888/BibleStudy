-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'PDF');

-- CreateTable
CREATE TABLE "MediaFile" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "key"       TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "mimeType"  TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "type"      "MediaType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaFile_key_key"      ON "MediaFile"("key");
CREATE INDEX "MediaFile_userId_idx"          ON "MediaFile"("userId");
CREATE INDEX "MediaFile_userId_type_idx"     ON "MediaFile"("userId", "type");

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
