-- Add sortOrder field to facilities, extracurriculars, programs, and alumni tables
-- for drag-and-drop reordering support

-- AlterTable: facilities
ALTER TABLE "facilities" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: extracurriculars
ALTER TABLE "extracurriculars" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: programs
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: alumni
ALTER TABLE "alumni" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: composite indexes for efficient ordering
CREATE INDEX IF NOT EXISTS "facilities_tenantId_sortOrder_idx" ON "facilities"("tenantId", "sortOrder");
CREATE INDEX IF NOT EXISTS "extracurriculars_tenantId_sortOrder_idx" ON "extracurriculars"("tenantId", "sortOrder");
CREATE INDEX IF NOT EXISTS "programs_tenantId_sortOrder_idx" ON "programs"("tenantId", "sortOrder");
CREATE INDEX IF NOT EXISTS "alumni_tenantId_sortOrder_idx" ON "alumni"("tenantId", "sortOrder");
