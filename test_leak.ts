import { db, withTenant } from "./src/lib/db";
import { isTenantScopedModel } from "./src/lib/tenant-scope";

async function main() {
  const tenantId = "some-tenant-id";
  const tenantDb = withTenant(tenantId);
  
  console.log("Is StaffPermit scoped?", isTenantScopedModel("StaffPermit"));
  
  // Try to find permits
  const permits = await tenantDb.staffPermit.findMany({
    where: {}
  });
  console.log("Permits retrieved:", permits.length);
}

main().catch(console.error);
