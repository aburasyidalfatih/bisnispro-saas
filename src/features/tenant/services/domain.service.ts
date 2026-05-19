/**
 * Domain service — logic untuk custom domain tenant.
 *
 * Tanggung jawab:
 * - Generate & verifikasi DNS TXT token
 * - Cache mapping domain → slug di Redis (dengan in-memory fallback)
 * - Invalidate cache saat domain berubah
 *
 * CATATAN EDGE RUNTIME:
 * File ini menggunakan Node.js `dns` module — TIDAK boleh diimport dari proxy.ts.
 * Hanya boleh dipakai di API routes dan server components.
 */

import dns from "dns/promises"
import crypto from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

// ==================== TYPES ====================

export type DomainStatus = "unverified" | "pending" | "verified" | "failed"

export interface CustomDomainSettings {
  domain: string
  status: DomainStatus
  verifyToken: string
  verifiedAt?: string
  failReason?: string
}

// ==================== TOKEN ====================

/**
 * Generate token unik untuk verifikasi DNS TXT record.
 * Format: smp-verify-<16 hex chars>
 */
export function generateVerifyToken(): string {
  return `smp-verify-${crypto.randomBytes(8).toString("hex")}`
}

// ==================== DNS VERIFICATION ====================

/**
 * Verifikasi domain dengan mengecek DNS TXT record.
 * Tenant harus menambahkan TXT record:
 *   Name:  _smp-verify.<domain>
 *   Value: <verifyToken>
 */
export async function verifyDomainDns(
  domain: string,
  verifyToken: string
): Promise<{ success: boolean; reason?: string }> {
  const txtHost = `_smp-verify.${domain}`

  try {
    const records = await dns.resolveTxt(txtHost)
    // records adalah array of array: [["value1"], ["value2"]]
    const flat = records.flat()
    if (flat.includes(verifyToken)) {
      return { success: true }
    }
    return {
      success: false,
      reason: `TXT record tidak ditemukan. Pastikan sudah menambahkan:\nName: ${txtHost}\nValue: ${verifyToken}`,
    }
  } catch (err: any) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      return {
        success: false,
        reason: `Domain ${domain} tidak ditemukan atau belum ada TXT record.`,
      }
    }
    logger.error("DNS verification error", err, { domain, txtHost })
    return { success: false, reason: "Gagal melakukan pengecekan DNS. Coba lagi nanti." }
  }
}

// ==================== REDIS CACHE ====================
// Cache mapping: domain → tenantSlug
// TTL: 1 jam — cukup untuk production, tidak terlalu lama jika domain berubah

const CACHE_TTL_SECONDS = 3600
const CACHE_PREFIX = "smp:domain:"

import { getRedisClient } from "@/lib/redis"

export async function cacheDomainSlug(domain: string, slug: string): Promise<void> {
  const redis = await getRedisClient()
  await redis.set(`${CACHE_PREFIX}${domain}`, slug, CACHE_TTL_SECONDS)
}

export async function getCachedDomainSlug(domain: string): Promise<string | null> {
  const redis = await getRedisClient()
  return redis.get(`${CACHE_PREFIX}${domain}`)
}

export async function invalidateDomainCache(domain: string): Promise<void> {
  const redis = await getRedisClient()
  await redis.del(`${CACHE_PREFIX}${domain}`)
}

// ==================== DB HELPERS ====================

/**
 * Ambil custom domain settings dari tenant.settings JSON.
 */
export function getDomainSettings(
  tenantSettings: Record<string, any> | null
): CustomDomainSettings | null {
  return (tenantSettings as any)?.customDomain ?? null
}

/**
 * Resolve tenant slug dari custom domain.
 * Urutan: cache → database.
 * Dipakai oleh internal API route yang dipanggil dari proxy.
 */
export async function resolveDomainToSlug(domain: string): Promise<string | null> {
  // 1. Cek cache
  const cached = await getCachedDomainSlug(domain)
  if (cached) return cached

  // 2. Fallback ke database
  const tenant = await db.tenant.findFirst({
    where: { domain, isActive: true },
    select: { slug: true, settings: true },
  })

  if (!tenant) return null

  // Hanya serve jika domain sudah verified
  const domainSettings = getDomainSettings(tenant.settings as any)
  if (domainSettings?.status !== "verified") return null

  // Simpan ke cache untuk request berikutnya
  await cacheDomainSlug(domain, tenant.slug)
  return tenant.slug
}
