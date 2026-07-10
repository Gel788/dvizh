-- Additive v38 migration: privacy tables + wishlist share token
-- Safe to apply on prod (no destructive changes)

CREATE TABLE IF NOT EXISTS "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");
CREATE INDEX IF NOT EXISTS "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");
CREATE INDEX IF NOT EXISTS "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

DO $$ BEGIN
  ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "HiddenPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HiddenPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HiddenPost_userId_postId_key" ON "HiddenPost"("userId", "postId");
CREATE INDEX IF NOT EXISTS "HiddenPost_userId_idx" ON "HiddenPost"("userId");

DO $$ BEGIN
  ALTER TABLE "HiddenPost" ADD CONSTRAINT "HiddenPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "HiddenPost" ADD CONSTRAINT "HiddenPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ContentReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetKind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentReport_targetKind_targetId_idx" ON "ContentReport"("targetKind", "targetId");
CREATE INDEX IF NOT EXISTS "ContentReport_reporterId_idx" ON "ContentReport"("reporterId");

DO $$ BEGIN
  ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Wishlist" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Wishlist_shareToken_key" ON "Wishlist"("shareToken");
