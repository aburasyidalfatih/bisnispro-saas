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

    const payment = await db.payment.findUnique({
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
    const proofUrl = fileData.path.startsWith("http") ? fileData.path : `/uploads/${fileData.name}`

    const currentMeta = payment.metadata as any
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "PENDING_VERIFICATION",
        metadata: {
           ...currentMeta,
           proofUrl: proofUrl
        }
      }
    })

    const { notifyTenantAdmins } = await import("@/features/notification/services/notification.service")
    await notifyTenantAdmins(payment.tenantId, {
      title: "Verifikasi Top-Up Manual",
      message: `Ada pengajuan Top-Up manual senilai Rp ${payment.amount.toLocaleString("id-ID")} yang menunggu verifikasi Anda.`,
      type: "info"
    })

    return NextResponse.json({ success: true, url: proofUrl })
  } catch (error: any) {
    console.error("Upload proof error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
