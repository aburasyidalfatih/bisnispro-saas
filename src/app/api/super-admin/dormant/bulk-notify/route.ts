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

    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["DORMANT_WA_TEMPLATE", "DORMANT_EMAIL_SUBJECT", "DORMANT_EMAIL_HTML"] } }
    })
    const getSetting = (key: string, defaultVal: string) => settings.find(s => s.key === key)?.value || defaultVal

    const subjectTemplate = getSetting("DORMANT_EMAIL_SUBJECT", "Bantuan Setup Website Sekolah - SchoolPro")
    const waTemplate = getSetting("DORMANT_WA_TEMPLATE", `Halo Admin {{tenant_name}},\n\nKami dari tim Support SchoolPro melihat bahwa website sekolah Anda (https://{{tenant_slug}}.schoolpro.id) sudah berhasil diaktifkan, namun sepertinya Anda belum pernah melakukan login untuk mengkonfigurasi sistem Anda.\n\nSilakan login menggunakan email pendaftaran Anda yaitu {{tenant_email}} beserta password yang sudah Anda buat saat mendaftar. Jika Anda lupa password, silakan gunakan fitur "Lupa Password" di halaman login untuk membuat password baru.\n\nApakah ada kendala yang bisa kami bantu?`)
    const htmlTemplate = getSetting("DORMANT_EMAIL_HTML", `<p>Halo Admin {{tenant_name}},</p><p>Kami dari tim Support SchoolPro melihat bahwa website sekolah Anda (<a href="https://{{tenant_slug}}.schoolpro.id">https://{{tenant_slug}}.schoolpro.id</a>) sudah berhasil diaktifkan, namun sepertinya Anda belum pernah melakukan login untuk mengkonfigurasi sistem Anda.</p><p>Silakan login menggunakan email pendaftaran Anda yaitu <strong>{{tenant_email}}</strong> beserta password yang sudah Anda buat saat mendaftar. Jika Anda lupa password, silakan gunakan fitur "Lupa Password" di halaman login untuk membuat password baru.</p><p>Apakah ada kendala yang bisa kami bantu? Anda bisa membalas email ini untuk berkonsultasi dengan kami.</p><p>Terima kasih,<br/>Tim Support SchoolPro</p>`)
    
    // Kirim notifikasi secara asynchronous (tidak diblokir)
    for (const tenant of tenants) {
      const waMessage = waTemplate
        .replace(/{{tenant_name}}/g, tenant.name)
        .replace(/{{tenant_slug}}/g, tenant.slug)
        .replace(/{{tenant_email}}/g, tenant.email || "")
        .replace(/{{tenant_phone}}/g, tenant.phone || "")

      const emailSubject = subjectTemplate
        .replace(/{{tenant_name}}/g, tenant.name)
        .replace(/{{tenant_slug}}/g, tenant.slug)

      const emailHtml = htmlTemplate
        .replace(/{{tenant_name}}/g, tenant.name)
        .replace(/{{tenant_slug}}/g, tenant.slug)
      
      if (type === "wa") {
        const phone = tenant.whatsapp || tenant.phone
        if (phone) {
          sendWhatsApp(phone, waMessage, null).catch(console.error)
        }
      } else if (type === "email") {
        if (tenant.email) {
          sendEmail(tenant.email, emailSubject, emailHtml, undefined).catch(console.error)
        }
      }
    }

    return NextResponse.json({ success: true, count: tenants.length })
  } catch (error) {
    console.error("Bulk notify error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
