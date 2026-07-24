import { PrismaClient, Prisma } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"
import { logger } from "@/lib/logger"
import * as Sentry from "@sentry/nextjs"
import { applyTenantScopeToArgs, assertTenantId, isTenantScopedModel } from "@/lib/tenant-scope"
export type { Prisma }
export { applyTenantScopeToArgs, assertTenantId, isTenantScopedModel } from "@/lib/tenant-scope"

const SLOW_QUERY_THRESHOLD_MS = 500

// Provide dummy fallback for build time
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy"
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === "development"
      ? [
          { level: "query", emit: "event" },
          { level: "error", emit: "stdout" },
          { level: "warn", emit: "stdout" },
        ]
      : [
          { level: "error", emit: "stdout" },
        ],
  })

  // ============================================================
  // ENTERPRISE TELEMETRY: Slow Query Detection
  // ============================================================
  if (process.env.NODE_ENV === "development") {
    ;(client as any).$on("query", (e: any) => {
      if (e.duration > SLOW_QUERY_THRESHOLD_MS) {
        console.warn(
          `\x1b[33m[SLOW QUERY]\x1b[0m ${e.duration}ms — ${e.query?.substring(0, 200)}`
        )
      }
    })
  }

  // Production: log slow queries via structured logger (lazy import to avoid circular deps)
  if (process.env.NODE_ENV === "production") {
    ;(client as any).$on?.("query", (e: any) => {
      if (e.duration > SLOW_QUERY_THRESHOLD_MS) {
        try {
          logger.warn("Slow query detected", {
            durationMs: e.duration,
            query: e.query?.substring(0, 300),
            params: e.params?.substring(0, 200),
          })

          // Also report to Sentry if available
          if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
            Sentry.captureMessage(`Slow query: ${e.duration}ms`, {
              level: "warning",
              extra: { query: e.query?.substring(0, 300), duration: e.duration },
            })
          }
        } catch {
          // Fail silently
        }
      }
    })
  }

  return client
}

export const baseDb = globalForPrisma.prisma ?? createPrismaClient()
export const db = baseDb.$extends(withAccelerate()) as unknown as PrismaClient

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseDb as unknown as PrismaClient

export async function runWithTenantContext<T>(
  tenantId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  assertTenantId(tenantId)

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, TRUE)`
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`
    return callback(tx)
  })
}

/**
 * Creates a scoped Prisma client that automatically injects tenantId 
 * into queries for safer multi-tenant data access.
 * ENTERPRISE V3: also sets PostgreSQL RLS context for every scoped query.
 */
export function withTenant(tenantId: string) {
  assertTenantId(tenantId)
  
  const scopedClient = baseDb.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!isTenantScopedModel(model)) {
            return query(args)
          }

          const scopedArgs = applyTenantScopeToArgs(args, operation, tenantId)

          // Transaction-local setting prevents connection pool cross-contamination.
          const [, , result] = await baseDb.$transaction([
            baseDb.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, TRUE)`,
            baseDb.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`,
            query(scopedArgs as typeof args),
          ])
          return result
        },
      },
    },
  })

  return scopedClient.$extends(withAccelerate()) as unknown as typeof db
}
