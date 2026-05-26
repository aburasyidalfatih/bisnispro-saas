import fs from "fs/promises"
import path from "path"
import { logger } from "@/lib/logger"

/**
 * Path ke folder konfigurasi dinamis Traefik yang dimount via docker-compose
 */
const TRAEFIK_DYNAMIC_DIR = process.env.TRAEFIK_DYNAMIC_DIR || "/app/traefik-dynamic"

/**
 * Nama container/service Next.js yang akan menjadi target reverse proxy
 * Di docker-compose.yml kita namanya adalah: compose-program-neural-port-6gtmbm-1-web@docker
 * Namun kita bisa mendapatkan nama ini dari environment atau default.
 */
const TRAEFIK_TARGET_SERVICE = process.env.TRAEFIK_TARGET_SERVICE || "compose-program-neural-port-6gtmbm-1-web@docker"
const TRAEFIK_TARGET_SERVICE_SECURE = process.env.TRAEFIK_TARGET_SERVICE_SECURE || "compose-program-neural-port-6gtmbm-1-websecure@docker"

/**
 * Membuat file YAML untuk Traefik Dynamic Configuration.
 * File ini akan dibaca otomatis oleh Traefik untuk mendaftarkan domain baru dan SSL Let's Encrypt.
 */
export async function createCustomDomainRoute(domain: string): Promise<boolean> {
  const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, "")
  const slug = safeDomain.replace(/\./g, "-")
  const fileName = `smp-custom-${slug}.yml`
  const filePath = path.join(TRAEFIK_DYNAMIC_DIR, fileName)

  const yamlContent = `http:
  routers:
    ${slug}-http:
      rule: "Host(\`${safeDomain}\`)"
      entryPoints:
        - web
      middlewares:
        - redirect-to-https@file
      service: ${TRAEFIK_TARGET_SERVICE}
    ${slug}-https:
      rule: "Host(\`${safeDomain}\`)"
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      service: ${TRAEFIK_TARGET_SERVICE_SECURE}
`

  try {
    // Pastikan direktori ada (opsional jika sudah dimount)
    await fs.mkdir(TRAEFIK_DYNAMIC_DIR, { recursive: true }).catch(() => {})
    
    // Tulis file
    await fs.writeFile(filePath, yamlContent, "utf-8")
    logger.info("Traefik dynamic route created", { domain, filePath })
    return true
  } catch (error) {
    logger.error("Failed to create Traefik route", { domain, error })
    // Jangan lempar error agar tidak membatalkan proses verifikasi, 
    // jika gagal karena path tidak ditemukan (misal di local dev), kita abaikan saja.
    return false
  }
}

/**
 * Menghapus file YAML Traefik saat custom domain dihapus.
 */
export async function removeCustomDomainRoute(domain: string): Promise<boolean> {
  const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, "")
  const slug = safeDomain.replace(/\./g, "-")
  const fileName = `smp-custom-${slug}.yml`
  const filePath = path.join(TRAEFIK_DYNAMIC_DIR, fileName)

  try {
    await fs.unlink(filePath)
    logger.info("Traefik dynamic route removed", { domain, filePath })
    return true
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      logger.error("Failed to remove Traefik route", { domain, error })
    }
    return false
  }
}
