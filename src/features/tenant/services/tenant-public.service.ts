import { getRedisClient } from "@/lib/redis"
import { logger } from "@/lib/logger"

export const TENANT_PUBLIC_CACHE_PREFIX = "smp:tenant:public:"

/**
 * @deprecated Gunakan modular fetchers dari `tenant-modular.service.ts` seperti `getTenantLayoutData`, `getTenantHomeData`, dsb.
 * Fungsi ini dibiarkan untuk mencegah build error jika ada sisa import yang terlewat, 
 * namun akan langsung mengembalikan error jika dipanggil.
 */
export const getPublicTenantBySlug = async (slug: string) => {
  throw new Error("getPublicTenantBySlug is deprecated and removed for performance reasons. Please use modular fetchers from tenant-modular.service.ts.")
}

/**
 * Menghapus semua cache Redis yang berkaitan dengan tenant (monolith maupun modular).
 * Fungsi ini dipanggil setiap kali ada perubahan data tenant dari sisi admin/super-admin.
 */
export async function invalidatePublicTenantCache(slug: string) {
  try {
    const redis = await getRedisClient()
    const keysToDelete = [
      `${TENANT_PUBLIC_CACHE_PREFIX}${slug}`, // Legacy monolith key
      `smp:tenant:layout:${slug}`,
      `smp:tenant:home:${slug}`,
      `smp:tenant:posts:${slug}`,
      `smp:tenant:achievements:${slug}`,
      `smp:tenant:programs:${slug}`,
      `smp:tenant:facilities:${slug}`,
      `smp:tenant:ekskul:${slug}`,
    ]
    await redis.del(...keysToDelete)
  } catch (error) {
    logger.error("Redis del error in invalidatePublicTenantCache", { error: String(error) })
  }
}
