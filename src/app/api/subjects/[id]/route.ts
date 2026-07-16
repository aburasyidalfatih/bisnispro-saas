import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const { id } = await params
    const body = await req.json()
    
    const { z } = await import("zod")
    const schema = z.object({
      name: z.string().min(1),
      code: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
      tenantId: z.string().min(1)
    })

    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    
    const { name, code, description, isActive, tenantId } = parsed.data
    
    const { requireTenantMembership } = await import("@/lib/api-utils")
    const { error } = await requireTenantMembership(tenantId)
    if (error) return error

    const subject = await db.subject.update({
      where: { id, tenantId },
      data: { name, code: code || null, description: description || null, isActive: isActive ?? true },
    })
    return NextResponse.json({ subject })
  } catch {
    return NextResponse.json({ error: "Gagal update mata pelajaran" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const url = new URL(req.url)
    const tenantId = url.searchParams.get("tenantId")
    if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

    const { requireTenantMembership } = await import("@/lib/api-utils")
    const { error } = await requireTenantMembership(tenantId)
    if (error) return error

    const { id } = await params
    await db.subject.delete({ where: { id, tenantId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Gagal menghapus mata pelajaran" }, { status: 500 })
  }
}
