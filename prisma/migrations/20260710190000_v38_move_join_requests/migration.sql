-- CreateEnum
CREATE TYPE "MoveJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "requiresApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MoveJoinRequest" (
    "id" TEXT NOT NULL,
    "activityKind" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "eventId" TEXT,
    "userId" TEXT NOT NULL,
    "status" "MoveJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MoveJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MoveJoinRequest_activityKind_activityId_status_idx" ON "MoveJoinRequest"("activityKind", "activityId", "status");
CREATE INDEX "MoveJoinRequest_userId_status_idx" ON "MoveJoinRequest"("userId", "status");
CREATE INDEX "MoveJoinRequest_eventId_status_idx" ON "MoveJoinRequest"("eventId", "status");

-- AddForeignKey
ALTER TABLE "MoveJoinRequest" ADD CONSTRAINT "MoveJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoveJoinRequest" ADD CONSTRAINT "MoveJoinRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
