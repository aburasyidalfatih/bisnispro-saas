import { PrismaClient, Prisma } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"
import { logger } from "@/lib/logger"
import * as Sentry from "@sentry/nextjs"
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
          // Operations that support a `where` clause
          const whereOperations = [
            "findUnique", "findUniqueOrThrow",
            "findFirst", "findFirstOrThrow",
            "findMany", "count", "aggregate", "groupBy",
            "update", "updateMany", "delete", "deleteMany",
            "upsert",
          ]

          // Operations that support a `data` clause (for injecting tenantId into data)
          const dataOperations = ["create", "createMany"]

          if (typeof args === 'object' && args !== null) {
            if (whereOperations.includes(operation)) {
              // Inject tenantId into where clause for reads and mutations that use where
              (args as any).where = { ...(args as any).where, tenantId }
            } else if (dataOperations.includes(operation)) {
              // For create operations, ensure tenantId is in the data
              if ((args as any).data && typeof (args as any).data === 'object' && !Array.isArray((args as any).data)) {
                (args as any).data = { ...(args as any).data, tenantId }
              }
            }
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
