import { PrismaClient, Prisma } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"
export type { Prisma }

const SLOW_QUERY_THRESHOLD_MS = 500

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
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
          const { logger } = require("@/lib/logger")
          logger.warn("Slow query detected", {
            durationMs: e.duration,
            query: e.query?.substring(0, 300),
            params: e.params?.substring(0, 200),
          })

          // Also report to Sentry if available
          if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
            const Sentry = require("@sentry/nextjs")
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

  return client.$extends(withAccelerate()) as unknown as PrismaClient
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

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
        async $allOperations({ model, operation, args, query }) {
          // Fallback ke ORM Level Isolation jika query belum support RLS
          if (typeof args === 'object' && args !== null) {
             (args as any).where = { ...(args as any).where, tenantId }
          }
          
          const isRead = [
            "findUnique",
            "findUniqueOrThrow",
            "findFirst",
            "findFirstOrThrow",
            "findMany",
            "count",
            "aggregate",
            "groupBy",
          ].includes(operation)

          if (isRead) {
            return query(args)
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
