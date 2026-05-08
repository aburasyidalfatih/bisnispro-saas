import { NextResponse } from "next/server"
import { saveFile } from "@/lib/services/upload"
import path from "path"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File harus diupload" }, { status: 400 })
    }

    // Hanya izinkan gambar untuk upload publik (logo sekolah)
    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp", "image/svg+xml"
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak diizinkan: ${file.type}. Hanya menerima gambar (JPG, PNG, WEBP, SVG).` },
        { status: 400 }
      )
    }

    // Batasi ukuran file max 2MB untuk upload publik
    const MAX_PUBLIC_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_PUBLIC_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file melebihi batas maksimum (2MB)` },
        { status: 400 }
      )
    }

    // Simpan file ke subfolder "public-registration"
    // tenantId diset undefined karena belum memiliki tenant
    const result = await saveFile(file, undefined, "public-registration", ["image"])

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
    })
  } catch (error) {
    logger.error("Public upload failed", error, { path: "/api/public/upload" })
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 })
  }
}
