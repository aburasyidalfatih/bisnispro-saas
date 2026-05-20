import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const settingsSchema = z.object({
  tenantId: z.string().min(1),
  settings: z.record(z.string(), z.any()),
})

// GET: ambil settings tenant (termasuk SMTP & WA config)
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  try {
    const { getTenantSettings } = await import("@/features/tenant/services/tenant-management.service")
    const settings = await getTenantSettings(tenantId, session.user.id, session.user.isSuperAdmin)
    return NextResponse.json(settings)
  } catch (error: any) {
    const status = error.message?.includes("izin") ? 403 : 500
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status })
  }
}

// PUT: update settings tenant
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, settingsSchema)
  if (parsed.error) return parsed.error
  const { tenantId, settings } = parsed.data

  try {
    const { updateTenantSettings } = await import("@/features/tenant/services/tenant-management.service")
    const result = await updateTenantSettings(tenantId, settings, session.user.id, session.user.isSuperAdmin)
    return NextResponse.json(result)
  } catch (error: any) {
    const status = error.message?.includes("izin") ? 403 : 500
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status })
  }
}
