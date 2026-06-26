import { PrismaClient } from "@prisma/client";
import { applyTenantScopeToArgs, isTenantScopedModel } from "./src/lib/tenant-scope";

console.log("isTenantScopedModel('StaffPermit'):", isTenantScopedModel("StaffPermit"));
console.log("isTenantScopedModel('staffPermit'):", isTenantScopedModel("staffPermit"));

const args = { where: {} };
const scoped = applyTenantScopeToArgs(args, "findMany", "tenant-123");
console.log("Scoped args:", JSON.stringify(scoped, null, 2));
