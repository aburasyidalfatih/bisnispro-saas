import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { z } from "zod"

const changeSubdomainSchema = z.object({
  tenantId: z.string(),
  newSlug: z.string()
    .min(3, "Subdomain minimal 3 karakter")
    .max(50, "Subdomain maksimal 50 karakter")
    .regex(/^[a-z0-9-]+$/, "Subdomain hanya boleh berisi huruf kecil, angka, dan strip (-)"),
})

export async function PUT(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  try {
    const body = await req.json()
    const parsed = changeSubdomainSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { tenantId, newSlug } = parsed.data
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

    const { changeSubdomain } = await import("@/features/tenant/services/tenant-management.service")
    const result = await changeSubdomain(tenantId, newSlug, session.user.id, session.user.isSuperAdmin)
    return NextResponse.json(result)
  } catch (err: any) {
    const msg = err.message || "Terjadi kesalahan internal peladen"
    const status = msg.includes("izin") ? 403 : msg.includes("sudah") ? 409 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
