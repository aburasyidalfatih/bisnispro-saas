import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { waQueue, importQueue, billingQueue, gamificationQueue, emailQueue } from "@/lib/queue"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/queue-status
 * 
 * Returns the status of all BullMQ queues for monitoring.
 * Only accessible by super admins or tenant admins.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.tenants?.[0]?.role
  const isSuperAdmin = session.user.isSuperAdmin

  if (!isSuperAdmin && role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const queues = [
      { name: "wa-queue", queue: waQueue },
      { name: "import-queue", queue: importQueue },
      { name: "billing-queue", queue: billingQueue },
      { name: "gamification-queue", queue: gamificationQueue },
      { name: "email-queue", queue: emailQueue },
    ]

    const statuses = await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
          ])

          return {
            name,
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + delayed,
          }
        } catch {
          return { name, error: "Queue not available" }
        }
      })
    )

    return NextResponse.json({
      queues: statuses,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch queue status" }, { status: 500 })
  }
}
