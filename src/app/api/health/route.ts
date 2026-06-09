import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getRedisClient } from "@/lib/redis"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Health Check Endpoint — untuk UptimeRobot, Betterstack, atau monitoring lainnya.
 * 
 * GET /api/health
 * 
 * Returns:
 * - status: "healthy" | "degraded" | "unhealthy"
 * - checks: individual component statuses
 * - uptime: server uptime in seconds
 * - memory: RSS memory usage in MB
 * - timestamp: current server time
 */
// eslint-disable-next-line react-doctor/nextjs-no-side-effect-in-get-handler
export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {}

  // 1. Database Check
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart }
  } catch (error: any) {
    checks.database = { status: "error", error: error.message }
  }

  // 2. Redis Check
  try {
    const redisStart = Date.now()
    const redis = await getRedisClient()
    await redis.set("health:ping", "pong", 10)
    const val = await redis.get("health:ping")
    checks.redis = { 
      status: val === "pong" ? "ok" : "degraded", 
      latencyMs: Date.now() - redisStart 
    }
  } catch (error: any) {
    checks.redis = { status: "error", error: error.message }
  }

  // 3. Memory Usage
  const memUsage = process.memoryUsage()
  const memoryMB = Math.round(memUsage.rss / 1024 / 1024)

  // 4. Determine overall status
  const hasErrors = Object.values(checks).some(c => c.status === "error")
  const hasDegraded = Object.values(checks).some(c => c.status === "degraded")
  const overallStatus = hasErrors ? "unhealthy" : hasDegraded ? "degraded" : "healthy"
  const httpStatus = hasErrors ? 503 : 200

  return NextResponse.json({
    status: overallStatus,
    checks,
    uptime: Math.round(process.uptime()),
    memory: {
      rss: memoryMB,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
    nodeVersion: process.version,
  }, { status: httpStatus })
}
