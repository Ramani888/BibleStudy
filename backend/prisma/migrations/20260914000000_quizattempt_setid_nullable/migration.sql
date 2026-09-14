-- Make QuizAttempt.setId nullable so AI-generated quizzes (topic / generated,
-- which have no source set) can be recorded. The existing FK stays valid — a
-- nullable foreign key is allowed; set-less rows simply have NULL setId.

-- AlterTable
ALTER TABLE "QuizAttempt" ALTER COLUMN "setId" DROP NOT NULL;
