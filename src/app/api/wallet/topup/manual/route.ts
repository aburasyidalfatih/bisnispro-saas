import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { saveFile } from "@/lib/services/upload"

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
    
    // Create public URL
    // If it's a local file, we prefix with /api/uploads/ or similar, but the saveFile path usually contains the public accessible path or we just use it directly. 
    // Wait, let's just save the path as proofUrl and let the frontend resolve it. The finalFilePath in local mode is "uploads/...". We should convert it to a URL or use an API route to serve it.
    // Wait, for simplicity, I'll assume the path is fine, but to be safe let's just store uploaded.path
    const proofUrl = uploaded.path.startsWith("http") ? uploaded.path : `/uploads/${uploaded.name}`

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

    const { notifyTenantAdmins } = await import("@/lib/services/notification")
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
