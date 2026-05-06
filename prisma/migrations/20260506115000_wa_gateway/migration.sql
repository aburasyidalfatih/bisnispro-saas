-- CreateTable
CREATE TABLE "wa_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "qrCode" TEXT,
    "creds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wa_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wa_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wa_sessions_tenantId_key" ON "wa_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "wa_sessions_status_idx" ON "wa_sessions"("status");

-- CreateIndex
CREATE INDEX "wa_messages_tenantId_idx" ON "wa_messages"("tenantId");

-- CreateIndex
CREATE INDEX "wa_messages_status_idx" ON "wa_messages"("status");

-- AddForeignKey
ALTER TABLE "wa_sessions" ADD CONSTRAINT "wa_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
