-- Remove Gatherings and Map features entirely

-- AlterEnum
BEGIN;
CREATE TYPE "ActivityType_new" AS ENUM ('ADDED_FRIEND', 'CREATED_SET', 'CREATED_CARD', 'STUDIED_CARDS', 'CREATED_NOTE');
ALTER TABLE "Activity" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "ActivityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Gathering" DROP CONSTRAINT "Gathering_hostId_fkey";
ALTER TABLE "GatheringParticipant" DROP CONSTRAINT "GatheringParticipant_gatheringId_fkey";
ALTER TABLE "GatheringParticipant" DROP CONSTRAINT "GatheringParticipant_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastLocationAt",
DROP COLUMN "locationLat",
DROP COLUMN "locationLng",
DROP COLUMN "locationName",
DROP COLUMN "locationPrivacy";

-- DropTable
DROP TABLE "GatheringParticipant";
DROP TABLE "Gathering";

-- DropEnum
DROP TYPE "LocationPrivacy";
DROP TYPE "ParticipantStatus";
