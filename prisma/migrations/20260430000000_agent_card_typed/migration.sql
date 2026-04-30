-- AlterTable
ALTER TABLE "AgentMessage" ADD COLUMN "cardType" TEXT,
ADD COLUMN "actions" JSONB,
ADD COLUMN "dismissed" BOOLEAN NOT NULL DEFAULT false;
