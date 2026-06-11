-- Enterprise RLS foundation and tenant-heavy index hardening.
--
-- This migration intentionally creates RLS helper functions and policies without
-- enabling row level security on tables yet. Enabling RLS must be done table by
-- table after the corresponding code path consistently sets app.current_tenant_id.

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')
$$;

CREATE OR REPLACE FUNCTION app.rls_bypass_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    lower(NULLIF(current_setting('app.bypass_rls', true), '')) = ANY (ARRAY['1', 'true', 'on', 'yes']),
    false
  )
$$;

-- Indexes for tenant-scoped hot paths that were missing composite coverage.
CREATE INDEX IF NOT EXISTS "drip_logs_tenantId_idx" ON "drip_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "drip_logs_tenantId_sentAt_idx" ON "drip_logs"("tenantId", "sentAt" DESC);

CREATE INDEX IF NOT EXISTS "wavio_message_logs_tenantId_status_idx" ON "wavio_message_logs"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "wavio_message_logs_tenantId_createdAt_idx" ON "wavio_message_logs"("tenantId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "tenant_notifications_tenantId_isRead_idx" ON "tenant_notifications"("tenantId", "isRead");
CREATE INDEX IF NOT EXISTS "tenant_notifications_tenantId_createdAt_idx" ON "tenant_notifications"("tenantId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "website_menus_tenantId_parentId_idx" ON "website_menus"("tenantId", "parentId");
CREATE INDEX IF NOT EXISTS "website_menus_tenantId_order_idx" ON "website_menus"("tenantId", "order");

CREATE INDEX IF NOT EXISTS "security_logs_tenantId_idx" ON "security_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "security_logs_tenantId_createdAt_idx" ON "security_logs"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "security_logs_attackType_createdAt_idx" ON "security_logs"("attackType", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "course_enrollments_tenantId_idx" ON "course_enrollments"("tenantId");
CREATE INDEX IF NOT EXISTS "course_enrollments_tenantId_status_idx" ON "course_enrollments"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "course_enrollments_tenantId_enrolledAt_idx" ON "course_enrollments"("tenantId", "enrolledAt" DESC);
CREATE INDEX IF NOT EXISTS "course_enrollments_userId_status_idx" ON "course_enrollments"("userId", "status");

CREATE INDEX IF NOT EXISTS "staff_permits_tenantId_status_idx" ON "staff_permits"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "staff_permits_tenantId_staffId_status_idx" ON "staff_permits"("tenantId", "staffId", "status");
CREATE INDEX IF NOT EXISTS "staff_permits_tenantId_createdAt_idx" ON "staff_permits"("tenantId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ai_memories_tenantId_userId_idx" ON "ai_memories"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "ai_memories_tenantId_createdAt_idx" ON "ai_memories"("tenantId", "createdAt" DESC);

-- Dormant tenant isolation policies. They become active only after
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY is applied for each table.
DO $$
DECLARE
  tenant_table text;
  tenant_tables text[] := ARRAY[
    'achievements',
    'affiliate_commissions',
    'ai_memories',
    'ai_usage_logs',
    'alumni',
    'attendance_permits',
    'attendance_records',
    'attendance_sessions',
    'audit_logs',
    'billing_types',
    'canteen_merchants',
    'canteen_orders',
    'canteen_products',
    'canteen_withdrawals',
    'cashflows',
    'categories',
    'cbt_exams',
    'cbt_question_banks',
    'classrooms',
    'contact_submissions',
    'course_enrollments',
    'discipline_records',
    'documents',
    'donation_campaigns',
    'donations',
    'drip_logs',
    'error_logs',
    'events',
    'extracurriculars',
    'facilities',
    'file_uploads',
    'grades',
    'installments',
    'internal_messages',
    'invitations',
    'invoice_payments',
    'invoices',
    'notifications',
    'page_views',
    'partnerships',
    'payments',
    'pendaftar_ppdbs',
    'periode_ppdbs',
    'popups',
    'posts',
    'programs',
    'rekenings',
    'schedules',
    'security_logs',
    'sliders',
    'staff',
    'staff_attendances',
    'staff_permits',
    'students',
    'subjects',
    'subscriptions',
    'teacher_journals',
    'tenant_galleries',
    'tenant_notifications',
    'tenant_scores',
    'tenant_users',
    'wa_messages',
    'wa_queue_logs',
    'wallet_accounts',
    'wallet_transactions',
    'wavio_message_logs',
    'website_menus'
  ];
BEGIN
  FOREACH tenant_table IN ARRAY tenant_tables LOOP
    IF to_regclass(format('%I.%I', 'public', tenant_table)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON %I.%I', 'public', tenant_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON %I.%I', 'public', tenant_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON %I.%I', 'public', tenant_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON %I.%I', 'public', tenant_table);

    EXECUTE format(
      'CREATE POLICY tenant_isolation_select ON %I.%I FOR SELECT USING (app.rls_bypass_enabled() OR "tenantId" = app.current_tenant_id())',
      'public',
      tenant_table
    );

    EXECUTE format(
      'CREATE POLICY tenant_isolation_insert ON %I.%I FOR INSERT WITH CHECK (app.rls_bypass_enabled() OR "tenantId" = app.current_tenant_id())',
      'public',
      tenant_table
    );

    EXECUTE format(
      'CREATE POLICY tenant_isolation_update ON %I.%I FOR UPDATE USING (app.rls_bypass_enabled() OR "tenantId" = app.current_tenant_id()) WITH CHECK (app.rls_bypass_enabled() OR "tenantId" = app.current_tenant_id())',
      'public',
      tenant_table
    );

    EXECUTE format(
      'CREATE POLICY tenant_isolation_delete ON %I.%I FOR DELETE USING (app.rls_bypass_enabled() OR "tenantId" = app.current_tenant_id())',
      'public',
      tenant_table
    );
  END LOOP;
END $$;
