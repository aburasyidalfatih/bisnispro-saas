"use server"

import { trackShare as trackShareService, getShareCount } from "../services/share.service"

export async function trackShareAction(postId: string, tenantId: string, platform: string) {
  try {
    const result = await trackShareService(postId, tenantId, platform)
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
