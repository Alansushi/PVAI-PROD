-- Add SharedSummary model for shareable project/portfolio summaries
CREATE TABLE IF NOT EXISTS "SharedSummary" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "scope"     TEXT NOT NULL,
  "projectId" TEXT,
  "content"   TEXT NOT NULL,
  "sentVia"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SharedSummary_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SharedSummary_userId_idx" ON "SharedSummary"("userId");

ALTER TABLE "SharedSummary"
  ADD CONSTRAINT "SharedSummary_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
