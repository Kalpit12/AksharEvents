-- Run in Neon SQL Editor (or via psql) when production is behind schema.prisma.
-- Safer alternative: npx prisma db push (use Neon's direct connection string, not pooler).

ALTER TYPE "MemberDocumentType" ADD VALUE IF NOT EXISTS 'BADGE_PHOTO';

CREATE TABLE IF NOT EXISTS "ExhibitorBadgeCheckIn" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventExhibitorId" TEXT NOT NULL,
  "memberLocalId" TEXT NOT NULL,
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedInBy" TEXT,
  CONSTRAINT "ExhibitorBadgeCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExhibitorBadgeCheckIn_eventExhibitorId_memberLocalId_key"
  ON "ExhibitorBadgeCheckIn"("eventExhibitorId", "memberLocalId");

CREATE INDEX IF NOT EXISTS "ExhibitorBadgeCheckIn_eventId_checkedInAt_idx"
  ON "ExhibitorBadgeCheckIn"("eventId", "checkedInAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ExhibitorBadgeCheckIn_eventId_fkey'
  ) THEN
    ALTER TABLE "ExhibitorBadgeCheckIn"
      ADD CONSTRAINT "ExhibitorBadgeCheckIn_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ExhibitorBadgeCheckIn_eventExhibitorId_fkey'
  ) THEN
    ALTER TABLE "ExhibitorBadgeCheckIn"
      ADD CONSTRAINT "ExhibitorBadgeCheckIn_eventExhibitorId_fkey"
      FOREIGN KEY ("eventExhibitorId") REFERENCES "EventExhibitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
