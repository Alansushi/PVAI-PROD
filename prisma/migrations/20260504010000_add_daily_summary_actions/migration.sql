-- Add actionsJson to UserDailySummary for daily banner quick action chips
ALTER TABLE "UserDailySummary"
  ADD COLUMN IF NOT EXISTS "actionsJson" JSONB;
