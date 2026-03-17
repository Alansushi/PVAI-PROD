-- CreateTable
CREATE TABLE "DeliverableDependency" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,

    CONSTRAINT "DeliverableDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliverableDependency_blockerId_idx" ON "DeliverableDependency"("blockerId");

-- CreateIndex
CREATE INDEX "DeliverableDependency_blockedId_idx" ON "DeliverableDependency"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliverableDependency_blockerId_blockedId_key" ON "DeliverableDependency"("blockerId", "blockedId");

-- AddForeignKey
ALTER TABLE "DeliverableDependency" ADD CONSTRAINT "DeliverableDependency_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableDependency" ADD CONSTRAINT "DeliverableDependency_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
