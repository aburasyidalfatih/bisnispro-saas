import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const slug = url.searchParams.get("slug")
  if (!slug) return NextResponse.json({ error: "slug harus diisi" }, { status: 400 })

  const tenant = await db.tenant.findUnique({ where: { slug }, select: { id: true, name: true, slug: true, logo: true, plan: true } })
  if (!tenant) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })

  return NextResponse.json(tenant)
}
