-- Add undo tracking fields to AgentMessage
ALTER TABLE "AgentMessage"
  ADD COLUMN IF NOT EXISTS "executed"    BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "undone"      BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "beforeState" JSONB;
