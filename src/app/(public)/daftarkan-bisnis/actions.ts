"use server"

import { db } from "@/lib/db"

export async function getTenantCount() {
  try {
    const count = await db.tenant.count({
      where: {
        isActive: true
      }
    })
    return count
  } catch (error) {
    console.error("Failed to get tenant count:", error)
    return 0
  }
}
