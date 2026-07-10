-- Additive v38: calendar events from Move (sourceKind + MOVE event type)

ALTER TYPE "PersonalEventType" ADD VALUE IF NOT EXISTS 'MOVE';

ALTER TABLE "PersonalCalendarEvent" ADD COLUMN IF NOT EXISTS "sourceKind" TEXT;
ALTER TABLE "PersonalCalendarEvent" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;

CREATE INDEX IF NOT EXISTS "PersonalCalendarEvent_userId_sourceKind_sourceId_idx"
  ON "PersonalCalendarEvent"("userId", "sourceKind", "sourceId");
