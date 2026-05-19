import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Cron handler: otomatis expire invoice pending yang melewati jatuh tempo
 * dan kembalikan kuota kupon yang digunakan.
 * 
 * Panggil via: GET /api/cron/expire-invoices?key=SECRET
 */
export async function GET(req: Request) {
  // Simple auth via query key
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (key !== (process.env.CRON_SECRET || "cron-secret-key")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { processExpiredInvoices } = await import("@/features/finance/services/billing.service")
    const result = await processExpiredInvoices()
    return NextResponse.json(result)
  } catch (error) {
    logger.error("Cron expire-invoices failed", error, { path: "/api/cron/expire-invoices" })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
