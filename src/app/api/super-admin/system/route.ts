import { NextResponse } from "next/server"
import os from "os"
import { exec } from "child_process"
import { promisify } from "util"
import { auth } from "@/lib/auth"
import { getRedisClient } from "@/lib/redis"
import { logger } from "@/lib/logger"

const execAsync = promisify(exec)

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsage = (usedMem / totalMem) * 100

    const cpus = os.cpus()
    const coreCount = cpus.length
    const loadAvg = os.loadavg()
    const cpuUsage = (loadAvg[0] / coreCount) * 100

    // Get PM2 Status
    let pm2Stats = []
    try {
      const { stdout } = await execAsync("pm2 jlist")
      const rawPm2 = JSON.parse(stdout)
      pm2Stats = rawPm2.map((p: any) => ({
        name: p.name,
        status: p.pm2_env.status,
        cpu: p.monit.cpu,
        memory: p.monit.memory,
        uptime: Date.now() - p.pm2_env.pm_uptime,
      }))
    } catch (e) {
      logger.error("PM2 fetch failed", e)
    }

    // Get Disk Status
    let diskStats = { total: 0, used: 0, free: 0, usagePercentage: 0 }
    try {
      const { stdout: dfOut } = await execAsync("df -k /")
      const lines = dfOut.trim().split("\n")
      if (lines.length > 1) {
        const parts = lines[1].trim().split(/\s+/)
        diskStats = {
          total: parseInt(parts[1]) * 1024,
          used: parseInt(parts[2]) * 1024,
          free: parseInt(parts[3]) * 1024,
          usagePercentage: parseInt(parts[4].replace('%', '')),
        }
      }
    } catch (e) {
      logger.error("Disk fetch failed", e)
    }

    // Service Dependencies Check
    const services: any[] = [
      { name: "PostgreSQL Database", type: "database", status: "offline", meta: "" },
      { name: "Edge Cache (Redis)", type: "cache", status: "offline", meta: "" },
      { name: "WA Queue Worker", type: "worker", status: "offline", meta: "" }
    ]

    // 1. Check DB
    try {
      await import("@/lib/db").then(m => m.db.$queryRaw`SELECT 1`)
      services[0].status = "online"
      services[0].meta = "Koneksi stabil"
    } catch {
      services[0].status = "offline"
      services[0].meta = "Koneksi terputus"
    }

    // 2. Check Redis
    try {
      const redisClient = await getRedisClient()
      await redisClient.get("health_check")
      services[1].status = "online"
      services[1].meta = "Latensi rendah"
    } catch {
      services[1].status = "offline"
      services[1].meta = "Tidak merespon"
    }

    // 3. Check WA Worker
    try {
      const pendingCount = await import("@/lib/db").then(m => m.db.waQueueLog.count({ where: { status: "PENDING" }}))
      services[2].status = "online"
      services[2].meta = `${pendingCount} antrean tertunda`
    } catch {
      services[2].status = "offline"
    }

    return NextResponse.json({
      ram: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercentage: memUsage,
      },
      cpu: {
        cores: coreCount,
        model: cpus[0]?.model || "Unknown",
        loadAverage: loadAvg,
        usagePercentage: Math.min(cpuUsage, 100),
      },
      disk: diskStats,
      os: {
        platform: os.platform(),
        release: os.release(),
        uptime: os.uptime(),
      },
      pm2: pm2Stats,
      services,
      timestamp: Date.now(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to retrieve system metrics" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const { action } = body

    if (action === "clear-cache") {
      const redis = await getRedisClient()
      await redis.flush()
      return NextResponse.json({ message: "Redis cache cleared successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    logger.error("System action failed", error, { path: "/api/super-admin/system" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
