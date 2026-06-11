-- CreateIndex
CREATE INDEX "wa_queue_logs_tenantId_status_idx" ON "wa_queue_logs"("tenantId", "status");

-- CreateIndex
CREATE INDEX "wa_queue_logs_tenantId_createdAt_idx" ON "wa_queue_logs"("tenantId", "createdAt" DESC);
