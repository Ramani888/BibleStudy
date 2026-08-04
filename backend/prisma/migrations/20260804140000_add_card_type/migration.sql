-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('QA', 'STORY');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN "type" "CardType" NOT NULL DEFAULT 'QA';

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN "mode" TEXT;
