-- Remove Groups feature: drop Group, GroupMember tables, groupId columns, GroupRole enum

DELETE FROM "Activity" WHERE type = 'JOINED_GROUP';

BEGIN;
CREATE TYPE "ActivityType_new" AS ENUM ('ADDED_FRIEND', 'JOINED_GATHERING', 'CREATED_SET', 'CREATED_CARD', 'STUDIED_CARDS', 'CREATED_NOTE');
ALTER TABLE "Activity" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "ActivityType_old";
COMMIT;

ALTER TABLE "Gathering" DROP CONSTRAINT IF EXISTS "Gathering_groupId_fkey";
ALTER TABLE "Group" DROP CONSTRAINT IF EXISTS "Group_ownerId_fkey";
ALTER TABLE "GroupMember" DROP CONSTRAINT IF EXISTS "GroupMember_groupId_fkey";
ALTER TABLE "GroupMember" DROP CONSTRAINT IF EXISTS "GroupMember_userId_fkey";

DROP INDEX IF EXISTS "Gathering_groupId_idx";
DROP INDEX IF EXISTS "StudyPlan_groupId_idx";

ALTER TABLE "Gathering" DROP COLUMN IF EXISTS "groupId";
ALTER TABLE "StudyPlan" DROP COLUMN IF EXISTS "groupId";

DROP TABLE IF EXISTS "GroupMember";
DROP TABLE IF EXISTS "Group";
DROP TYPE IF EXISTS "GroupRole";
