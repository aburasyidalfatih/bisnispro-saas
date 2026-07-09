import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendWhatsApp, sendEmail } from "@/features/notification/services/notification.service"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { type, tenantIds } = await req.json()
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal satu tenant" }, { status: 400 })
    }
    if (type !== "wa" && type !== "email") {
      return NextResponse.json({ error: "Tipe notifikasi tidak valid" }, { status: 400 })
    }

    const tenants = await db.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, slug: true, email: true, whatsapp: true, phone: true }
    })

    const subject = "Bantuan Setup Website Sekolah - SchoolPro"
    
    // Kirim notifikasi secara asynchronous (tidak diblokir)
    for (const tenant of tenants) {
      const message = `Halo Admin ${tenant.name},\n\nKami dari tim Support SchoolPro melihat bahwa website sekolah Anda (https://${tenant.slug}.schoolpro.id) sudah berhasil diaktifkan, namun sepertinya Anda belum pernah melakukan login untuk mengkonfigurasi sistem Anda.\n\nApakah ada kendala yang bisa kami bantu?`
      
      if (type === "wa") {
        const phone = tenant.whatsapp || tenant.phone
        if (phone) {
          // enqueueWhatsApp
          sendWhatsApp(phone, message, null).catch(console.error)
        }
      } else if (type === "email") {
        if (tenant.email) {
          const html = `<p>Halo Admin ${tenant.name},</p><p>Kami dari tim Support SchoolPro melihat bahwa website sekolah Anda (<a href="https://${tenant.slug}.schoolpro.id">https://${tenant.slug}.schoolpro.id</a>) sudah berhasil diaktifkan, namun sepertinya Anda belum pernah melakukan login untuk mengkonfigurasi sistem Anda.</p><p>Apakah ada kendala yang bisa kami bantu? Anda bisa membalas email ini untuk berkonsultasi dengan kami.</p><p>Terima kasih,<br/>Tim Support SchoolPro</p>`
          sendEmail(tenant.email, subject, html, undefined).catch(console.error)
        }
      }
    }

    return NextResponse.json({ success: true, count: tenants.length })
  } catch (error) {
    console.error("Bulk notify error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
