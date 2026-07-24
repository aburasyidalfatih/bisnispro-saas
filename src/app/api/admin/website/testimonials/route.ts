import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { invalidateDashboardCache } from "@/features/tenant/services/tenant-management.service"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })

    const data = await db.testimonial.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 })
    
    await requireTenantMembership(tenantId, ["OWNER", "ADMIN", "STAFF"])
    
    const body = await req.json()
    const { name, role, company, testimonial, imageUrl, rating } = body
    
    if (!name || !testimonial) return NextResponse.json({ error: "Nama dan testimoni wajib diisi" }, { status: 400 })

    const result = await db.testimonial.create({
      data: {
        tenantId,
        name,
        role: role || "Customer",
        company,
        testimonial,
        imageUrl,
        rating: rating || 5
      }
    })

    await invalidateDashboardCache(tenantId)
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
