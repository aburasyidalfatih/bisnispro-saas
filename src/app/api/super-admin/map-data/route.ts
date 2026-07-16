import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { findCoordinates } from "@/lib/data"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 1. Ambil semua Tenant aktif (lokasi dari settings JSON)
  const tenants = await db.tenant.findMany({
    where: { isActive: true },
    take: 500,
    select: { id: true, name: true, slug: true, settings: true }
  })

  // 2. Ambil semua pengajuan (status PENDING/REVISION)
  const applications = await db.tenantApplication.findMany({
    where: { status: { in: ["PENDING", "REVISION"] } },
    take: 200,
    select: { id: true, schoolName: true, province: true, regency: true, status: true }
  })

  // 3. Map ke koordinat
  const points: { lat: number; lng: number; name: string; type: "tenant" | "application"; slug?: string }[] = []

  for (const t of tenants) {
    const s = t.settings as any
    if (s?.province) {
      const coord = findCoordinates(s.province, s.regency || "")
      if (coord) {
        points.push({ ...coord, name: t.name, type: "tenant", slug: t.slug })
      }
    }
  }

  for (const a of applications) {
    if (a.province) {
      const coord = findCoordinates(a.province, a.regency || "")
      if (coord) {
        points.push({ ...coord, name: a.schoolName, type: "application" })
      }
    }
  }

  return NextResponse.json({ points, totalTenants: tenants.length, totalApplications: applications.length })
}
