-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "ipHash" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_tenantId_idx" ON "page_views"("tenantId");

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_tenantId_createdAt_idx" ON "page_views"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "page_views_tenantId_source_idx" ON "page_views"("tenantId", "source");

-- CreateIndex
CREATE INDEX "page_views_tenantId_path_idx" ON "page_views"("tenantId", "path");

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
