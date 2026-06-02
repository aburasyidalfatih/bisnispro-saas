import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveFile } from "@/features/upload/services/upload.service"
import { db } from "@/lib/db"

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

    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 })
    }
    if (payment.plan !== "AI_TOKEN_USER") {
       return NextResponse.json({ error: "Jenis pembayaran tidak valid" }, { status: 400 })
    }

    // Upload file using central upload service
    const uploaded = await saveFile(file, payment.tenantId, "proofs", ["image"])
    if (!uploaded.success || !uploaded.data) {
      return NextResponse.json({ error: uploaded.error || "Gagal mengupload bukti pembayaran" }, { status: 400 })
    }

    const proofUrl = uploaded.data.url

    // Update payment status
    const currentMeta = payment.metadata as any
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "PENDING_VERIFICATION",
        metadata: {
          ...currentMeta,
          proofUrl
        }
      }
    })

    // Kirim notifikasi ke super admin (opsional)
    import("@/features/finance/services/billing-notification.service").then(({ notifySuperAdminPaymentSuccess }) => {
      // Re-use notifySuperAdminPaymentSuccess for manual pending alerts, or you can just let it sit in pending
    }).catch(() => {})

    return NextResponse.json({ success: true, url: proofUrl })
  } catch (error: any) {
    console.error("Upload proof error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
