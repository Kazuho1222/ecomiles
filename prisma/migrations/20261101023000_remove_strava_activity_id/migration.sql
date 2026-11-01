-- DropIndex
DROP INDEX IF EXISTS "activities_strava_activity_id_key";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN IF EXISTS "strava_activity_id";
