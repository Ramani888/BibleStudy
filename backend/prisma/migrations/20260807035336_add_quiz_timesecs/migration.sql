-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "timeSecs" INTEGER,
ALTER COLUMN "practicedAt" DROP DEFAULT;
