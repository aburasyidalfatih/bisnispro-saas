import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")

  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, message: "Minimal 3 karakter" })
  }

  // Cek di tabel Tenant dan TenantApplication
  const existingTenant = await db.tenant.findUnique({ where: { slug } })
  const existingApp = await db.tenantApplication.findUnique({ where: { businessSlug: slug } })

  const available = !existingTenant && !existingApp

  return NextResponse.json({ 
    available,
    message: available ? "Subdomain tersedia" : "Sudah digunakan" 
  })
}
