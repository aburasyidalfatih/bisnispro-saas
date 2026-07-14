import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const keys = ["DORMANT_WA_TEMPLATE", "DORMANT_EMAIL_SUBJECT", "DORMANT_EMAIL_HTML"]
    const settings = await db.platformSetting.findMany({
      where: { key: { in: keys } },
    })

    const data: Record<string, string> = {}
    
    // Default values if not set
    data.DORMANT_WA_TEMPLATE = `Halo Admin {{tenant_name}},\n\nKami dari tim Support SchoolPro melihat bahwa website sekolah Anda (https://{{tenant_slug}}.schoolpro.id) sudah berhasil diaktifkan, namun sepertinya Anda belum pernah melakukan login untuk mengkonfigurasi sistem Anda.\n\nApakah ada kendala yang bisa kami bantu?`
    data.DORMANT_EMAIL_SUBJECT = `Bantuan Setup Website Sekolah - SchoolPro`
    data.DORMANT_EMAIL_HTML = `<p>Halo Admin {{tenant_name}},</p><p>Kami dari tim Support SchoolPro melihat bahwa website sekolah Anda (<a href="https://{{tenant_slug}}.schoolpro.id">https://{{tenant_slug}}.schoolpro.id</a>) sudah berhasil diaktifkan, namun sepertinya Anda belum pernah melakukan login untuk mengkonfigurasi sistem Anda.</p><p>Apakah ada kendala yang bisa kami bantu? Anda bisa membalas email ini untuk berkonsultasi dengan kami.</p><p>Terima kasih,<br/>Tim Support SchoolPro</p>`

    // Override with DB values
    settings.forEach((s) => {
      if (s.value) {
        data[s.key] = s.value
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to get dormant templates:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { DORMANT_WA_TEMPLATE, DORMANT_EMAIL_SUBJECT, DORMANT_EMAIL_HTML } = body

    const upserts = [
      { key: "DORMANT_WA_TEMPLATE", value: DORMANT_WA_TEMPLATE },
      { key: "DORMANT_EMAIL_SUBJECT", value: DORMANT_EMAIL_SUBJECT },
      { key: "DORMANT_EMAIL_HTML", value: DORMANT_EMAIL_HTML },
    ]

    for (const item of upserts) {
      if (item.value !== undefined) {
        await db.platformSetting.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: { key: item.key, value: item.value },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save dormant templates:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
