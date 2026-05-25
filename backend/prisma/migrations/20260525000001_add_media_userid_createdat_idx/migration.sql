-- CreateIndex
CREATE INDEX "MediaFile_userId_createdAt_idx" ON "MediaFile"("userId", "createdAt" DESC);
