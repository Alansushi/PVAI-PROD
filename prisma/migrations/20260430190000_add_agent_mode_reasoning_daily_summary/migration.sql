-- Add agentMode to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "agentMode" TEXT NOT NULL DEFAULT 'equilibrado';

-- Add reasoning to AgentMessage
ALTER TABLE "AgentMessage"
  ADD COLUMN IF NOT EXISTS "reasoning" TEXT;

-- Create UserDailySummary table
CREATE TABLE IF NOT EXISTS "UserDailySummary" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "date"      TEXT NOT NULL,
    "content"   TEXT NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDailySummary_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint and index
ALTER TABLE "UserDailySummary"
  ADD CONSTRAINT "UserDailySummary_userId_date_key" UNIQUE ("userId", "date");

CREATE INDEX IF NOT EXISTS "UserDailySummary_userId_idx" ON "UserDailySummary"("userId");

-- Add foreign key
ALTER TABLE "UserDailySummary"
  ADD CONSTRAINT "UserDailySummary_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
