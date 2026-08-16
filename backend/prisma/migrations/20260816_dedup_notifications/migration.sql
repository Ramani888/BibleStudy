-- First remove any existing duplicate notifications, keeping the oldest one
DELETE FROM "Notification" n1
USING "Notification" n2
WHERE n1."userId" = n2."userId"
  AND n1."type" = n2."type"
  AND n1."referenceId" = n2."referenceId"
  AND n1."createdAt" > n2."createdAt";

-- AddUniqueConstraint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_type_referenceId_key" UNIQUE ("userId", "type", "referenceId");
