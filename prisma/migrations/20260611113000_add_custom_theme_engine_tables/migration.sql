-- Persist Theme Engine entities used by /super-admin/themes.
-- This migration is intentionally defensive because some environments may
-- already have these objects from earlier db push/manual schema changes.

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "template" TEXT DEFAULT 'default';
UPDATE "tenants" SET "template" = 'default' WHERE "template" IS NULL;
ALTER TABLE "tenants" ALTER COLUMN "template" SET DEFAULT 'default';
ALTER TABLE "tenants" ALTER COLUMN "template" SET NOT NULL;

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customThemeId" TEXT;

CREATE TABLE IF NOT EXISTS "custom_themes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "author" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "thumbnail" TEXT,
    "layoutHtml" TEXT NOT NULL,
    "indexHtml" TEXT NOT NULL,
    "facilityHtml" TEXT,
    "customCss" TEXT NOT NULL,
    "customJs" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aboutHtml" TEXT,
    "achievementHtml" TEXT,
    "contactHtml" TEXT,
    "extracurricularHtml" TEXT,
    "galleryHtml" TEXT,
    "newsDetailHtml" TEXT,
    "newsHtml" TEXT,
    "programHtml" TEXT,
    "staffHtml" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pengumumanHtml" TEXT,
    "pengumumanDetailHtml" TEXT,
    "ppdbHtml" TEXT,
    "alumniHtml" TEXT,
    "agendaHtml" TEXT,
    "unduhanHtml" TEXT,
    "staffDetailHtml" TEXT,

    CONSTRAINT "custom_themes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "author" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "version" TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "thumbnail" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "layoutHtml" TEXT NOT NULL DEFAULT '';
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "indexHtml" TEXT NOT NULL DEFAULT '';
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "facilityHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "customCss" TEXT NOT NULL DEFAULT '';
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "customJs" TEXT NOT NULL DEFAULT '';
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "aboutHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "achievementHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "contactHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "extracurricularHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "galleryHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "newsDetailHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "newsHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "programHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "staffHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "pengumumanHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "pengumumanDetailHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "ppdbHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "alumniHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "agendaHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "unduhanHtml" TEXT;
ALTER TABLE "custom_themes" ADD COLUMN IF NOT EXISTS "staffDetailHtml" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenants_customThemeId_fkey'
    ) THEN
        ALTER TABLE "tenants"
        ADD CONSTRAINT "tenants_customThemeId_fkey"
        FOREIGN KEY ("customThemeId") REFERENCES "custom_themes"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "tenants_template_idx" ON "tenants"("template");
CREATE INDEX IF NOT EXISTS "tenants_customThemeId_idx" ON "tenants"("customThemeId");
CREATE INDEX IF NOT EXISTS "custom_themes_name_idx" ON "custom_themes"("name");
CREATE INDEX IF NOT EXISTS "custom_themes_isActive_idx" ON "custom_themes"("isActive");
CREATE INDEX IF NOT EXISTS "custom_themes_createdAt_idx" ON "custom_themes"("createdAt");
