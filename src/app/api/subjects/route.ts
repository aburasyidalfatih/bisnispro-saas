import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    const subjects = await db.subject.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ subjects })
  } catch (e: any) {
    console.error("GET /api/subjects error:", e)
    return NextResponse.json({ error: e.message || "Gagal memuat mata pelajaran" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await req.json()
    const { tenantId, name, code, description } = body
    if (!tenantId || !name) return NextResponse.json({ error: "tenantId & name required" }, { status: 400 })
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (tenant?.plan === "free") {
      const subjectCount = await db.subject.count({ where: { tenantId } })
      if (subjectCount >= 1) {
        return NextResponse.json({ 
          error: "Kuota maksimal 1 mata pelajaran untuk paket Free. Silakan upgrade paket untuk menambah." 
        }, { status: 403 })
      }
    }

    const subject = await db.subject.create({
      data: { tenantId, name, code: code || null, description: description || null },
    })
    return NextResponse.json({ subject })
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Kode mata pelajaran sudah digunakan" }, { status: 409 })
    return NextResponse.json({ error: "Gagal membuat mata pelajaran" }, { status: 500 })
  }
}
