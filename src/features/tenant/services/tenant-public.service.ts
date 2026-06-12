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
    const { clearTenantCache } = await import("./tenant-modular.service")
    await clearTenantCache(slug)

    const redis = await getRedisClient()
    await redis.del(`${TENANT_PUBLIC_CACHE_PREFIX}${slug}`)

    try {
      const { db } = await import("@/lib/db")
      const tenant = await db.tenant.findUnique({ where: { slug }, select: { id: true } })

      const { revalidatePath, revalidateTag } = await import("next/cache")
      revalidatePath("/", "layout")
      revalidatePath(`/site/${slug}`, "layout")
      revalidatePath(`/site/${slug}/pengumuman`, "page")
      revalidatePath(`/site/${slug}/berita`, "page")
      revalidatePath(`/site/${slug}/agenda`, "page")
      revalidatePath(`/site/${slug}/gallery`, "page")
      revalidateTag(`tenant-${slug}`)
      revalidateTag(`tenant-layout-${slug}`)
      revalidateTag(`tenant-home-${slug}`)
      if (tenant) {
        revalidateTag(`tenant-${tenant.id}`)
      }
      revalidateTag(`tenant-public`)
    } catch (e) {
      console.error("Error in Next.js revalidate API:", e)
    }
  } catch (error) {
    logger.error("Redis del error in invalidatePublicTenantCache", { error: String(error) })
  }
}
