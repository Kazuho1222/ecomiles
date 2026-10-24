-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "email",
DROP COLUMN IF EXISTS "intervalsAccessToken",
DROP COLUMN IF EXISTS "intervalsRefreshToken",
DROP COLUMN IF EXISTS "stravaAccessToken",
DROP COLUMN IF EXISTS "stravaAthleteId",
DROP COLUMN IF EXISTS "stravaConnected",
DROP COLUMN IF EXISTS "stravaExpiresAt",
DROP COLUMN IF EXISTS "stravaRefreshToken";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_intervalsAthleteId_key" ON "users"("intervalsAthleteId");

-- Clear invalid legacy expiresAt (legacy code set 8-hour TTL even for long-lived/API-key tokens)
UPDATE "users" SET "intervalsExpiresAt" = NULL WHERE "intervalsExpiresAt" < NOW();

