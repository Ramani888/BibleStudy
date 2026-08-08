-- AlterTable
ALTER TABLE "AIChat" ADD COLUMN     "followUps" TEXT[] DEFAULT ARRAY[]::TEXT[];
