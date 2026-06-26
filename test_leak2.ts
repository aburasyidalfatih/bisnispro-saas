import { db, withTenant } from "./src/lib/db";

async function main() {
  const tenantDb = withTenant("TEST-TENANT");
  try {
    await tenantDb.staffPermit.findMany({ where: {} });
  } catch (e: any) {
    console.log("Query threw:", e.message);
  }
}

main().catch(console.error);
