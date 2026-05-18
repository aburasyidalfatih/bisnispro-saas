import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const search = url.searchParams.get("search") || ""

  let whereClause: any = {}
  if (search) {
    whereClause = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }
  }

  const users = await db.user.findMany({
    where: whereClause,
    include: {
      tenants: {
        include: {
          tenant: true
        }
      },
      affiliateProfile: true
    },
    orderBy: { createdAt: "desc" }
  })

  // Format CSV
  const header = ["ID", "Nama", "Email", "Role", "Lembaga", "Tanggal Bergabung"]
  
  const rows = users.map(user => {
    // Determine Roles
    const roles = []
    if (user.isSuperAdmin) roles.push("Super Admin")
    if (user.affiliateProfile) roles.push("Mitra Afiliasi")
    if (user.tenants.length > 0) roles.push("Admin Tenant")
    if (roles.length === 0) roles.push("User Biasa")

    // Determine Tenants
    const tenants = user.tenants.map(t => `${t.tenant.name} (${t.role})`).join(" | ")

    return [
      user.id,
      `"${user.name || ""}"`,
      `"${user.email || ""}"`,
      `"${roles.join(", ")}"`,
      `"${tenants}"`,
      `"${new Date(user.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}"`
    ].join(",")
  })

  const csvContent = [header.join(","), ...rows].join("\n")

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="Data_Pengguna_SchoolPro_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}
