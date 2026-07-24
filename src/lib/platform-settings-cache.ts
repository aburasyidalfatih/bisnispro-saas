import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

/**
 * Centralized cached helper for PlatformSetting queries.
 * Uses Next.js unstable_cache with tag-based revalidation.
 * Cache TTL: 1 hour (3600s). Invalidate via revalidateTag("platform-settings").
 */
export const getCachedPlatformSettings = unstable_cache(
  async (keys?: string[]) => {
    if (keys && keys.length > 0) {
      const settings = await db.platformSetting.findMany({
        where: { key: { in: keys } },
      })
      return settings.reduce(
        (acc, s) => ({ ...acc, [s.key]: s.value }),
        {} as Record<string, string>
      )
    }
    const allSettings = await db.platformSetting.findMany()
    return allSettings.reduce(
      (acc, s) => ({ ...acc, [s.key]: s.value }),
      {} as Record<string, string>
    )
  },
  ["platform-settings"],
  { revalidate: 3600, tags: ["platform-settings"] }
)
