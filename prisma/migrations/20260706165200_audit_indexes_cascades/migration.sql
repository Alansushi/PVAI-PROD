-- Índices para tablas calientes (velocity, activity feed, historial del agente)
-- y cascadas de borrado para que eliminar un proyecto limpie su historial.

-- DropForeignKey (recrear con ON DELETE CASCADE)
ALTER TABLE "AgentMessage" DROP CONSTRAINT "AgentMessage_projectId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_projectId_fkey";

-- CreateIndex
CREATE INDEX "GanttRow_projectId_idx" ON "GanttRow"("projectId");
CREATE INDEX "AgentMessage_projectId_createdAt_idx" ON "AgentMessage"("projectId", "createdAt");
CREATE INDEX "AgentMessage_userId_createdAt_idx" ON "AgentMessage"("userId", "createdAt");
CREATE INDEX "AuditLog_projectId_createdAt_idx" ON "AuditLog"("projectId", "createdAt");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
