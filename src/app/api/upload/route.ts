import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveFile } from "@/features/upload/services/upload.service"
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

    // AUTHORIZATION CHECK: Prevent IDOR (uploading files to other tenants)
    if (tenantId && !session.user.isSuperAdmin) {
      const userTenants = session.user.tenants || []
      const hasAccess = userTenants.some((t: any) => t.id === tenantId)
      if (!hasAccess) {
        return NextResponse.json({ error: "Unauthorized to upload to this tenant" }, { status: 403 })
      }
    }

    if (!file) {
      return NextResponse.json({ error: "File harus diupload" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 5 MB." }, { status: 400 })
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
    
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || "Gagal mengupload file" }, { status: 400 })
    }

    const fileData = result.data

    return NextResponse.json({
      message: "File berhasil diupload",
      url: fileData.url,
      file: {
        name: fileData.name,
        size: fileData.size,
        mimeType: fileData.mimeType,
        path: fileData.path,
        url: fileData.url,
      },
      ...(result.storageWarning ? { storageWarning: result.storageWarning } : {}),
    })
  } catch (error) {
    logger.error("Upload failed", error, { path: "/api/upload" })
    return NextResponse.json({ error: "Upload gagal: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
