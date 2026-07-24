import { NextResponse } from "next/server"
import { saveFile } from "@/features/upload/services/upload.service"
import { logger } from "@/lib/logger"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
    const { success } = await rateLimit(`public-upload:${ip}`, 10, 600_000)
    if (!success) {
      return NextResponse.json({ error: "Terlalu banyak upload. Coba lagi nanti." }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File harus diupload" }, { status: 400 })
    }

    // Hanya izinkan gambar untuk upload publik (logo perusahaan)
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
    
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || "Gagal mengupload file" }, { status: 400 })
    }

    return NextResponse.json({
      message: "File berhasil diupload",
      url: result.data.url,
    })
  } catch (error) {
    logger.error("Public upload failed", error, { path: "/api/public/upload" })
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 })
  }
}
