-- RLS canary activation for low-blast-radius tenant tables.
--
-- No FORCE ROW LEVEL SECURITY yet. This keeps rollout safer for environments
-- where the application role still owns the tables, while enforcing policies
-- for non-owner application roles.

ALTER TABLE IF EXISTS "website_menus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "staff_permits" ENABLE ROW LEVEL SECURITY;
