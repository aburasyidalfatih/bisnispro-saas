import { PrismaClient, Prisma } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"
export type { Prisma }

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends(withAccelerate()) as unknown as PrismaClient

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db as unknown as PrismaClient

/**
 * Creates a scoped Prisma client that automatically injects tenantId 
 * into queries for safer multi-tenant data access.
 */
export function withTenant(tenantId: string) {
  if (!tenantId) {
    throw new Error("withTenant requires a valid tenantId")
  }
  
  return db.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        }
        // Note: findUnique and update/delete require unique identifiers
        // which may not include tenantId. We leave them alone for now
        // to avoid Prisma runtime validation errors, but developers
        // should use findFirst/updateMany if scoped by tenantId.
      },
    },
  })
}

/**
 * Enterprise RLS (Phase 3): Database-level isolation using PostgreSQL RLS.
 * This is meant to replace `withTenant` after `scratch/rls-migration.sql` 
 * is applied to the production database.
 */
export function withTenantRLS(tenantId: string) {
  if (!tenantId) {
    throw new Error("withTenantRLS requires a valid tenantId")
  }
  
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Interactive transaction to prevent connection pooling cross-contamination
          const [, result] = await db.$transaction([
            db.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`,
            query(args),
          ])
          return result
        },
      },
    },
  })
}
