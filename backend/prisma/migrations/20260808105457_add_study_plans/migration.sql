-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlanStep" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,

    CONSTRAINT "StudyPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlanProgress" (
    "userId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyPlanProgress_pkey" PRIMARY KEY ("userId","stepId")
);

-- CreateIndex
CREATE INDEX "StudyPlan_userId_idx" ON "StudyPlan"("userId");

-- CreateIndex
CREATE INDEX "StudyPlan_groupId_idx" ON "StudyPlan"("groupId");

-- CreateIndex
CREATE INDEX "StudyPlanStep_planId_idx" ON "StudyPlanStep"("planId");

-- CreateIndex
CREATE INDEX "StudyPlanStep_setId_idx" ON "StudyPlanStep"("setId");

-- CreateIndex
CREATE INDEX "StudyPlanProgress_userId_idx" ON "StudyPlanProgress"("userId");

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanStep" ADD CONSTRAINT "StudyPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanStep" ADD CONSTRAINT "StudyPlanStep_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanProgress" ADD CONSTRAINT "StudyPlanProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanProgress" ADD CONSTRAINT "StudyPlanProgress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "StudyPlanStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
