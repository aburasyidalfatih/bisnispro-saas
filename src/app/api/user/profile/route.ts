import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").optional(),
  phone: z.string().max(20).optional().nullable(),
  avatar: z.string().max(500).optional().nullable(),
})

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, profileSchema)
  if (parsed.error) return parsed.error

  // Check email uniqueness if email is changed
  if (parsed.data.email && parsed.data.email !== session.user.email) {
    const existing = await db.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) {
      return NextResponse.json({ error: "Email sudah digunakan oleh akun lain" }, { status: 400 })
    }
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || null,
      avatar: parsed.data.avatar !== undefined ? (parsed.data.avatar || null) : undefined,
    },
  })

  // Sync to all associated Staff profiles
  await db.staff.updateMany({
    where: { userId: session.user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || null,
      ...(parsed.data.avatar !== undefined ? { imageUrl: parsed.data.avatar || null } : {})
    }
  })

  // Invalidate tenant caches so updated avatar reflects on frontend articles/bios immediately
  if (session.user.tenants && Array.isArray(session.user.tenants)) {
    for (const tu of session.user.tenants) {
      if (tu.slug) {
        await clearTenantCache(tu.slug)
      }
    }
  }

  return NextResponse.json({ message: "Profil berhasil diperbarui", name: updated.name, avatar: updated.avatar })
}
