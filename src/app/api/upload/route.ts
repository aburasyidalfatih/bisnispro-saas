import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveFile } from "@/lib/services/upload"
import path from "path"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const tenantId = formData.get("tenantId") as string | null
    const subDir = formData.get("subDir") as string | null

    if (!file) {
      return NextResponse.json({ error: "File harus diupload" }, { status: 400 })
    }

    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak diizinkan: ${file.type}` },
        { status: 400 }
      )
    }

    const result = await saveFile(file, tenantId || undefined, subDir || undefined)

    // Konversi path absolut filesystem ke URL publik via /api/files/...
    let publicUrl = result.path
    if (!result.path.startsWith("http")) {
      const uploadDirResolved = path.resolve(process.env.UPLOAD_DIR || "./uploads")
      const fileResolved = path.resolve(result.path)
      
      const relativeToUpload = fileResolved
        .replace(uploadDirResolved, "")
        .replace(/\\/g, "/")
        .replace(/^\//, "")
      publicUrl = `/api/files/${relativeToUpload}`
    }

    return NextResponse.json({
      message: "File berhasil diupload",
      url: publicUrl,
      file: {
        name: result.name,
        size: result.size,
        mimeType: result.mimeType,
        path: result.path,
        url: publicUrl,
      },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : ""
    if (errMsg.includes("batas maksimum") || errMsg.includes("Quota penyimpanan")) {
      return NextResponse.json({ error: errMsg }, { status: 400 })
    }
    logger.error("Upload failed", error, { path: "/api/upload" })
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 })
  }
}
