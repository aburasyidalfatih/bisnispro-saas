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
 * ENTERPRISE V3: Uses PostgreSQL Row Level Security (RLS) for absolute safety.
 */
export function withTenant(tenantId: string) {
  if (!tenantId) {
    throw new Error("withTenant requires a valid tenantId")
  }
  
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Fallback ke ORM Level Isolation jika query belum support RLS
          if (typeof args === 'object' && args !== null) {
             (args as any).where = { ...(args as any).where, tenantId }
          }
          // Interactive transaction to prevent connection pooling cross-contamination and enforce RLS
          const [, result] = await db.$transaction([
            db.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, TRUE)`,
            query(args),
          ])
          return result
        },
      },
    },
  })
}
