import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { saveFile } from "@/features/upload/services/upload.service"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const paymentId = formData.get("paymentId") as string

    if (!file || !paymentId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const payment = await db.invoicePayment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 })
    }

    // Upload file using central upload service
    const uploaded = await saveFile(file, payment.tenantId, "proofs", ["image"])
    
    if (!uploaded.success || !uploaded.data) {
      return NextResponse.json({ error: uploaded.error || "Gagal mengupload bukti pembayaran" }, { status: 400 })
    }

    // Create public URL
    const fileData = uploaded.data
    let proofUrl = fileData.path
    if (!fileData.path.startsWith("http")) {
      const path = await import("path")
      const uploadDirResolved = path.resolve(process.env.UPLOAD_DIR || "./uploads")
      const fileResolved = path.resolve(fileData.path)
      const relativeToUpload = fileResolved
        .replace(uploadDirResolved, "")
        .replace(/\\/g, "/")
        .replace(/^\//, "")
      proofUrl = `/api/files/${relativeToUpload}`
    }

    await db.invoicePayment.update({
      where: { id: paymentId },
      data: {
        status: "PENDING_VERIFICATION", // Update from PENDING to PENDING_VERIFICATION so UI knows proof is uploaded
        proofUrl: proofUrl
      }
    })

    return NextResponse.json({ success: true, url: proofUrl })
  } catch (error: any) {
    console.error("Upload invoice proof error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
