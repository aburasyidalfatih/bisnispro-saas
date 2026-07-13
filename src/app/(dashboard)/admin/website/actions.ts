"use server"

import { db } from "@/lib/db"
import { subDays, format, addDays } from "date-fns"

export async function getAdminActivityHeatmap(tenantId: string) {
  try {
    const today = new Date()
    const startDate = subDays(today, 365)
    
    const logs = await db.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true
      }
    })

    const activityMap: Record<string, number> = {}

    // Pre-fill 365 days with 0
    for (let i = 0; i <= 365; i++) {
      const d = addDays(startDate, i)
      activityMap[format(d, "yyyy-MM-dd")] = 0
    }

    logs.forEach(log => {
      const dateStr = format(log.createdAt, "yyyy-MM-dd")
      if (activityMap[dateStr] !== undefined) {
        activityMap[dateStr] += 1
      }
    })

    const result = Object.entries(activityMap).map(([date, count]) => {
      let level = 0
      if (count > 0 && count <= 3) level = 1
      else if (count > 3 && count <= 10) level = 2
      else if (count > 10 && count <= 25) level = 3
      else if (count > 25) level = 4

      return {
        date,
        count,
        level: level as 0 | 1 | 2 | 3 | 4
      }
    })

    // Sort by date ascending
    result.sort((a, b) => a.date.localeCompare(b.date))

    return result

  } catch (error) {
    console.error("Error fetching activity heatmap:", error)
    return []
  }
}
export async function getRecentActivity(tenantId: string) {
  try {
    const logs = await db.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, image: true, email: true } }
      }
    })
    
    return logs
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return []
  }
}
