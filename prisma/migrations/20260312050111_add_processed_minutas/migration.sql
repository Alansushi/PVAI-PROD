-- CreateTable
CREATE TABLE "ProcessedMinuta" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actionsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedMinuta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessedMinuta_projectId_idx" ON "ProcessedMinuta"("projectId");

-- AddForeignKey
ALTER TABLE "ProcessedMinuta" ADD CONSTRAINT "ProcessedMinuta_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedMinuta" ADD CONSTRAINT "ProcessedMinuta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
