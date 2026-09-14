-- Remember the AI topic a quiz was generated from, so the hub/detail can show
-- the source (topic vs sets) distinctly from the user-chosen quiz name.

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN "topic" TEXT;
