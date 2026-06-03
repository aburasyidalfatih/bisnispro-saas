import fs from "fs"
import path from "path"
import crypto from "crypto"
import { db } from "@/lib/db"
import sharp from "sharp"
import { logger } from "@/lib/logger"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB

// Whitelist of allowed MIME types — extend per project
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  video: ["video/mp4", "video/webm"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
}

const ALL_ALLOWED_MIMES = Object.values(ALLOWED_MIME_TYPES).flat()

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/csv": ".csv",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
}

export type UploadResultDTO = {
  success: boolean
  data?: { path: string; url: string; name: string; size: number; mimeType: string }
  error?: string
  storageWarning?: { message: string; usagePercent: number }
}

function sanitizeDirName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "")
}

export function ensureUploadDir(subDir?: string) {
  const safeSub = subDir ? sanitizeDirName(subDir) : ""
  const dir = safeSub ? path.join(UPLOAD_DIR, safeSub) : UPLOAD_DIR
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

export async function saveFile(
  file: File,
  tenantId?: string,
  subDir?: string,
  allowedCategories?: (keyof typeof ALLOWED_MIME_TYPES)[]
): Promise<UploadResultDTO> {
  try {
    let storageWarningResult: { message: string; usagePercent: number } | undefined

    if (file.type.startsWith("image/") && file.size > 2 * 1024 * 1024) {
      return { success: false, error: "gambar harus kurang dari 2 mb" }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: `Ukuran file melebihi batas maksimum per file (${MAX_FILE_SIZE / 1024 / 1024}MB)` }
    }

    if (tenantId) {
      const tenant = await db.tenant.findUnique({
        where: { id: tenantId },
        include: { subscriptionPlan: true },
      })

      const maxStorage = tenant?.subscriptionPlan?.maxStorage || (tenant?.plan === "free" ? 100 : 1024)

      if (maxStorage > 0) {
        // fileUpload removed from Prisma schema
        const currentUsageBytes = 0
        const maxStorageBytes = maxStorage * 1024 * 1024
        
        if (currentUsageBytes + file.size > maxStorageBytes) {
          const maxLimitStr = maxStorage >= 1024 ? `${(maxStorage / 1024).toFixed(0)} GB` : `${maxStorage} MB`
          return { success: false, error: `Quota penyimpanan habis. Paket langganan Anda dibatasi maksimal ${maxLimitStr}. Silakan hapus file lama atau upgrade paket.` }
        }

        // Storage warning at 80%+ usage
        const usageAfterUpload = currentUsageBytes + file.size
        const usagePercent = Math.round((usageAfterUpload / maxStorageBytes) * 100)

        if (usagePercent >= 80) {
          const maxLimitStr = maxStorage >= 1024 ? `${(maxStorage / 1024).toFixed(1)} GB` : `${maxStorage} MB`
          const usedStr = (usageAfterUpload / (1024 * 1024)).toFixed(1)

          // Store warning for response
          storageWarningResult = {
            message: usagePercent >= 95
              ? `⚠️ Penyimpanan hampir penuh! (${usagePercent}% dari ${maxLimitStr} terpakai). Segera upgrade paket atau hapus file lama.`
              : `Penyimpanan ${usagePercent}% terpakai (${usedStr} MB dari ${maxLimitStr}). Pertimbangkan untuk upgrade paket.`,
            usagePercent,
          }

          // Send notification at 90%+ (once per threshold)
          if (usagePercent >= 90) {
            try {
              const cacheKey = `storage-warn:${tenantId}:${usagePercent >= 95 ? "95" : "90"}`
              const { Redis } = await import("ioredis")
              const redis = process.env.REDIS_URL
                ? new Redis(process.env.REDIS_URL)
                : new Redis({ host: process.env.REDIS_HOST || "127.0.0.1", port: parseInt(process.env.REDIS_PORT || "6379"), password: process.env.REDIS_PASSWORD || undefined })
              
              const alreadyWarned = await redis.get(cacheKey)
              if (!alreadyWarned) {
                const { notifyTenantAdmins } = await import("@/features/notification/services/notification.service")
                await notifyTenantAdmins(tenantId, {
                  title: usagePercent >= 95 ? "⚠️ Penyimpanan Hampir Penuh!" : "📦 Penyimpanan Menipis",
                  message: usagePercent >= 95
                    ? `Penyimpanan sekolah Anda sudah ${usagePercent}% penuh (${usedStr} MB dari ${maxLimitStr}). Segera upgrade paket atau hapus file yang tidak diperlukan agar layanan tetap berjalan lancar.`
                    : `Penyimpanan sekolah Anda sudah ${usagePercent}% terpakai (${usedStr} MB dari ${maxLimitStr}). Pertimbangkan upgrade paket untuk menambah kapasitas penyimpanan.`,
                  type: "warning",
                })
                // Prevent duplicate notification for 24 hours
                await redis.set(cacheKey, "1", "EX", 86400)
              }
              await redis.quit()
            } catch {
              // Non-fatal: notification failure should not block upload
            }
          }
        }
      }
    }

    const allowedMimes = allowedCategories
      ? allowedCategories.flatMap((cat) => ALLOWED_MIME_TYPES[cat] || [])
      : ALL_ALLOWED_MIMES

    if (!allowedMimes.includes(file.type)) {
      return { success: false, error: `Tipe file "${file.type}" tidak diizinkan. Tipe yang diizinkan: ${allowedMimes.join(", ")}` }
    }

    let buffer = Buffer.from(await file.arrayBuffer())
    let mimeType = file.type
    let ext = MIME_TO_EXT[file.type] || ""

    const isImage = mimeType.startsWith("image/")
    const isSvg = mimeType === "image/svg+xml"
    
    if (isImage && !isSvg) {
      try {
        buffer = await sharp(buffer)
          .webp({ quality: 80 })
          .toBuffer() as any
        mimeType = "image/webp"
        ext = ".webp"
      } catch (error) {
        logger.error("Image processing error", error)
      }
    }

    const randomName = crypto.randomBytes(16).toString("hex")
    const filename = `${Date.now()}-${randomName}${ext}`

    const resolvedSubDir = subDir || tenantId || "general"
    const s3Key = `${resolvedSubDir}/${filename}`

    let isS3 = false
    let s3Config: any = {}
    try {
      const setting = await db.platformSetting.findUnique({ where: { key: "STORAGE_PROVIDER" } })
      if (setting?.value === "s3") {
        isS3 = true
        const keys = ["S3_ENDPOINT", "S3_REGION", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET", "S3_PUBLIC_URL"]
        const settings = await db.platformSetting.findMany({ where: { key: { in: keys } } })
        settings.forEach(s => { s3Config[s.key] = s.value })
      }
    } catch (e) {
      logger.error("Failed to fetch storage config", e)
    }

    let finalFilePath = ""

    if (isS3 && s3Config.S3_ACCESS_KEY && s3Config.S3_BUCKET) {
      const s3Client = new S3Client({
        region: s3Config.S3_REGION || "auto",
        endpoint: s3Config.S3_ENDPOINT || undefined,
        credentials: {
          accessKeyId: s3Config.S3_ACCESS_KEY,
          secretAccessKey: s3Config.S3_SECRET_KEY,
        },
      })

      await s3Client.send(new PutObjectCommand({
        Bucket: s3Config.S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
      }))

      const publicUrlBase = (s3Config.S3_PUBLIC_URL || "").replace(/\/$/, "")
      finalFilePath = `${publicUrlBase}/${s3Key}`
    } else {
      const dir = ensureUploadDir(resolvedSubDir)
      finalFilePath = path.join(dir, filename)

      const resolvedPath = path.resolve(finalFilePath)
      const resolvedBase = path.resolve(UPLOAD_DIR)
      if (!resolvedPath.startsWith(resolvedBase)) {
        return { success: false, error: "Path traversal detected" }
      }

      fs.writeFileSync(finalFilePath, buffer)
    }

    // Compute public URL
    let publicUrl = finalFilePath
    if (!finalFilePath.startsWith("http")) {
      const uploadDirResolved = path.resolve(UPLOAD_DIR)
      const fileResolved = path.resolve(finalFilePath)
      const relativeToUpload = fileResolved
        .replace(uploadDirResolved, "")
        .replace(/\\/g, "/")
        .replace(/^\//, "")
      publicUrl = `/api/files/${relativeToUpload}`
    }

    // db.fileUpload removed from Prisma schema
    // await db.fileUpload.create({ ... })

    return {
      success: true,
      data: {
        path: finalFilePath,
        url: publicUrl,
        name: file.name,
        size: buffer.length,
        mimeType: mimeType,
      },
      storageWarning: storageWarningResult,
    }
  } catch (error) {
    logger.error("File upload failed", error)
    return { success: false, error: "Terjadi kesalahan internal saat menyimpan file" }
  }
}

export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (filePath.startsWith("http")) {
      const setting = await db.platformSetting.findUnique({ where: { key: "STORAGE_PROVIDER" } })
      if (setting?.value === "s3") {
        const keys = ["S3_ENDPOINT", "S3_REGION", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET", "S3_PUBLIC_URL"]
        const settings = await db.platformSetting.findMany({ where: { key: { in: keys } } })
        const s3Config: any = {}
        settings.forEach(s => { s3Config[s.key] = s.value })

        const publicUrlBase = (s3Config.S3_PUBLIC_URL || "").replace(/\/$/, "")
        if (filePath.startsWith(publicUrlBase)) {
          const s3Key = filePath.replace(`${publicUrlBase}/`, "")
          const s3Client = new S3Client({
            region: s3Config.S3_REGION || "auto",
            endpoint: s3Config.S3_ENDPOINT || undefined,
            credentials: {
              accessKeyId: s3Config.S3_ACCESS_KEY,
              secretAccessKey: s3Config.S3_SECRET_KEY,
            },
          })
          await s3Client.send(new DeleteObjectCommand({
            Bucket: s3Config.S3_BUCKET,
            Key: s3Key,
          }))
        }
      }
      return { success: true }
    }

    const resolvedPath = path.resolve(filePath)
    const resolvedBase = path.resolve(UPLOAD_DIR)
    if (!resolvedPath.startsWith(resolvedBase)) {
      return { success: false, error: "Cannot delete file outside upload directory" }
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath)
    }
    return { success: true }
  } catch (error) {
    logger.error("File deletion failed", error)
    return { success: false, error: "Gagal menghapus file" }
  }
}
