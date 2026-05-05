ALTER TABLE "AgentMessage"
  ADD COLUMN IF NOT EXISTS "dismissReason" TEXT,
  ADD COLUMN IF NOT EXISTS "dismissNote"   TEXT;
