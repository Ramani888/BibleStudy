/*
  Warnings:

  - Added the required column `practicedAt` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN "practicedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
