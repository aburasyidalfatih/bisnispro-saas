"use server"

import { trackShare as trackShareService, getShareCount } from "../services/share.service"
import { headers } from "next/headers"

export async function trackShareAction(postId: string, tenantId: string, platform: string) {
  try {
    const headersList = await headers()
    let ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    if (ip.includes(",")) ip = ip.split(",")[0].trim()

    const result = await trackShareService(postId, tenantId, platform, ip)
    return result
  } catch (error) {
    return { success: false, totalShares: 0 }
  }
}

export async function getShareCountAction(postId: string) {
  try {
    const count = await getShareCount(postId)
    return { success: true, count }
  } catch {
    return { success: false, count: 0 }
  }
}
