-- Add idempotency key to AgentMessage for dedup of chip requests
ALTER TABLE "AgentMessage" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT UNIQUE;
