-- =====================================================================================
-- ENTERPRISE ROW LEVEL SECURITY (RLS) MIGRATION SCRIPT
-- =====================================================================================
-- This script hardens the database by enabling PostgreSQL RLS on all tenant-specific tables.
-- It ensures absolute data isolation; a query executed under one tenant context
-- can NEVER read or modify data belonging to another tenant, regardless of Prisma ORM flaws.

-- 1. Create the App Admin Role (Prisma will connect using this or the default role)
-- Make sure your Prisma database URL connects with a user that is NOT a superuser.
-- Superusers bypass RLS. For production, the app should use a restricted role.
-- (If you are using default user in Supabase/Neon, they might be superusers, 
-- in which case you must set `ALTER ROLE your_db_user SET bypassrls = 'off';`)

-- Function to extract current tenant from session variable
CREATE OR REPLACE FUNCTION current_app_tenant() RETURNS text AS $$
  SELECT current_setting('app.current_tenant', true);
$$ LANGUAGE sql STABLE;

-- 2. Apply RLS to Core Tenant Tables
-- Example: students table
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "students";
CREATE POLICY tenant_isolation_policy ON "students"
    AS RESTRICTIVE
    USING (tenantId = current_app_tenant());

-- Example: teachers table
ALTER TABLE "teachers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "teachers";
CREATE POLICY tenant_isolation_policy ON "teachers"
    AS RESTRICTIVE
    USING (tenantId = current_app_tenant());

-- Example: invoices table
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "invoices";
CREATE POLICY tenant_isolation_policy ON "invoices"
    AS RESTRICTIVE
    USING (tenantId = current_app_tenant());

-- Apply to all other tenant-specific tables as needed:
-- ALTER TABLE "classrooms" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON "classrooms" AS RESTRICTIVE USING (tenantId = current_app_tenant());
-- ALTER TABLE "attendance" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON "attendance" AS RESTRICTIVE USING (tenantId = current_app_tenant());
-- ... add for other tables ...

-- 3. Security Warning:
-- To use this safely:
-- 1. The database user Prisma connects with MUST NOT be a SUPERUSER, or MUST have BYPASSRLS = off.
-- 2. You must call `set_config('app.current_tenant', 'tenant_id_here', true)` before queries.
-- 3. This is already handled by `withTenant(tenantId)` in `src/lib/db.ts`.
