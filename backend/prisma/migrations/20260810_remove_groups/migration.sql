-- Remove Groups feature: drop Group + GroupMember tables, StudyPlan.groupId, GroupRole enum.
--
-- NOTE: the ActivityType enum cleanup and the Gathering table drop are handled by
-- 20260810_remove_gatherings_map, which runs BEFORE this migration (alphabetical order).
-- The original version of this file re-did the enum swap (wrongly re-adding JOINED_GATHERING)
-- and referenced the already-dropped Gathering table + the already-removed JOINED_GROUP enum
-- value, so it failed on both dev and any fresh deploy. This migration now only drops the
-- Group-specific objects. Every statement is IF EXISTS, so it is idempotent — a harmless
-- no-op where the objects are already gone, correct where they still exist.

DROP INDEX IF EXISTS "StudyPlan_groupId_idx";
ALTER TABLE "StudyPlan" DROP COLUMN IF EXISTS "groupId";

DROP TABLE IF EXISTS "GroupMember";
DROP TABLE IF EXISTS "Group";

DROP TYPE IF EXISTS "GroupRole";
