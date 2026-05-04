-- Add scope to AgentMessage
ALTER TABLE "AgentMessage"
  ADD COLUMN IF NOT EXISTS "scope" TEXT;
