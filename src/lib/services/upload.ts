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
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
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

// Map allowed MIME types to extensions for safe extension derivation
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

/**
 * Sanitize a directory name to prevent path traversal.
 * Only allow alphanumeric, hyphens, underscores.
 */
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

/**
 * Validate and save an uploaded file.
 *
 * Security measures:
 * - MIME type whitelist validation
 * - File size limit enforcement
 * - Random filename generation (no user input in path)
 * - Path traversal prevention on subdirectory names
 */
export async function saveFile(
  file: File,
  tenantId?: string,
  subDir?: string,
  allowedCategories?: (keyof typeof ALLOWED_MIME_TYPES)[]
): Promise<{ path: string; name: string; size: number; mimeType: string }> {
  // === Size check ===
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Ukuran file melebihi batas maksimum (${MAX_FILE_SIZE / 1024 / 1024}MB)`)
  }

  // === MIME type check ===
  const allowedMimes = allowedCategories
    ? allowedCategories.flatMap((cat) => ALLOWED_MIME_TYPES[cat] || [])
    : ALL_ALLOWED_MIMES

  if (!allowedMimes.includes(file.type)) {
    throw new Error(
      `Tipe file "${file.type}" tidak diizinkan. Tipe yang diizinkan: ${allowedMimes.join(", ")}`
    )
  }

  // === Prepare file info ===
  let buffer = Buffer.from(await file.arrayBuffer())
  let mimeType = file.type
  let ext = MIME_TO_EXT[file.type] || ""

  // === Image processing: Convert to WebP (except SVG) ===
  const isImage = mimeType.startsWith("image/")
  const isSvg = mimeType === "image/svg+xml"
  
  if (isImage && !isSvg) {
    try {
      buffer = await sharp(buffer)
        .webp({ quality: 80 }) // High quality WebP
        .toBuffer() as any
      mimeType = "image/webp"
      ext = ".webp"
    } catch (error) {
      logger.error("Image processing error", error)
      // Fallback to original buffer if sharp fails
    }
  }

  // === Generate cryptographically random filename ===
  const randomName = crypto.randomBytes(16).toString("hex")
  const filename = `${Date.now()}-${randomName}${ext}`

  const resolvedSubDir = subDir || tenantId || "general"
  const s3Key = `${resolvedSubDir}/${filename}`

  // === Check Storage Config ===
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
    // === Upload to S3 ===
    const s3Client = new S3Client({
      region: s3Config.S3_REGION || "auto",
      endpoint: s3Config.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: s3Config.S3_ACCESS_KEY,
        secretAccessKey: s3Config.S3_SECRET_KEY,
      },
      // Cloudflare R2 requires signature version v4, usually handled automatically
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
    // === Upload to Local Disk ===
    const dir = ensureUploadDir(resolvedSubDir)
    finalFilePath = path.join(dir, filename)

    const resolvedPath = path.resolve(finalFilePath)
    const resolvedBase = path.resolve(UPLOAD_DIR)
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error("Path traversal detected")
    }

    fs.writeFileSync(finalFilePath, buffer)
  }

  // === Record in database ===
  await db.fileUpload.create({
    data: {
      tenantId,
      name: file.name,
      path: finalFilePath,
      mimeType: mimeType,
      size: buffer.length,
    },
  })

  return {
    path: finalFilePath,
    name: file.name,
    size: buffer.length,
    mimeType: mimeType,
  }
}

export async function deleteFile(filePath: string) {
  if (filePath.startsWith("http")) {
    // Note: To implement S3 deletion, we need to extract the S3Key from the URL
    // For now, we only delete local files or we could implement S3 deletion
    try {
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
    } catch (e) {
      logger.error("Failed to delete from S3", e)
    }
    return
  }

  // Safety check: only delete files inside UPLOAD_DIR
  const resolvedPath = path.resolve(filePath)
  const resolvedBase = path.resolve(UPLOAD_DIR)
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error("Cannot delete file outside upload directory")
  }

  if (fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath)
  }
}

export { ALLOWED_MIME_TYPES }
