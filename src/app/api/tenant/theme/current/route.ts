import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: fetch current theme + template for a tenant
// Used by ColorThemeProvider and AppearancePage to sync from database
export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const slug = url.searchParams.get("slug")

  if (!tenantId && !slug) {
    return NextResponse.json({ error: "tenantId atau slug harus diisi" }, { status: 400 })
  }

  const tenant = await db.tenant.findUnique({
    where: tenantId ? { id: tenantId } : { slug: slug! },
    select: { theme: true, template: true, plan: true },
  })

  if (!tenant) {
    return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json({ 
    theme: tenant.theme || "aurora",
    template: tenant.template || "default",
    plan: tenant.plan || "free",
  })
}
