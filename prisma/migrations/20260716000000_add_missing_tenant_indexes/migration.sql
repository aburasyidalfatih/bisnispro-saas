-- Add missing tenantId indexes on tenant-scoped e-rapor / kurikulum tables.
-- These models are frequently filtered by tenantId but lacked an index whose
-- leading column is tenantId, forcing sequential scans as data grows.
-- Defensive (IF NOT EXISTS) so environments that already created these via
-- `db push` remain consistent.

CREATE INDEX IF NOT EXISTS "learning_objectives_tenantId_idx" ON "learning_objectives"("tenantId");
CREATE INDEX IF NOT EXISTS "formative_scores_tenantId_idx" ON "formative_scores"("tenantId");
CREATE INDEX IF NOT EXISTS "summative_scores_tenantId_idx" ON "summative_scores"("tenantId");
CREATE INDEX IF NOT EXISTS "report_cards_tenantId_idx" ON "report_cards"("tenantId");
CREATE INDEX IF NOT EXISTS "p5_projects_tenantId_idx" ON "p5_projects"("tenantId");
