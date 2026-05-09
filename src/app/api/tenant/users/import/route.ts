import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { tenantId, users } = await req.json()
    if (!tenantId || !users || !Array.isArray(users)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Verify tenant access
    const hasAccess = session.user.tenants?.some((t: any) => t.id === tenantId && ["owner", "admin"].includes(t.role))
    if (!hasAccess && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 })
    }

    let successCount = 0
    const defaultPassword = await bcrypt.hash("admin123", 12)

    // Process sequentially to handle relation upserts safely
    for (const row of users) {
      const email = row["Email"]?.trim()
      if (!email) continue

      const name = row["Nama Lengkap"] || "User Tanpa Nama"
      const phone = row["No HP (Opsional)"] || null
      let role = row["Role (guru/admin/staff)"]?.toLowerCase() || "guru"
      if (!["guru", "admin", "staff"].includes(role)) {
        role = "guru"
      }

      // Check if user exists
      let user = await db.user.findUnique({ where: { email } })

      if (!user) {
         // Create new user
         user = await db.user.create({
            data: {
               name,
               email,
               phone,
               password: defaultPassword, // default pass
               isActive: true
            }
         })
      }

      // Check if they are already in this tenant
      const existingTu = await db.tenantUser.findUnique({
         where: { tenantId_userId: { tenantId, userId: user.id } }
      })

      if (!existingTu) {
         await db.tenantUser.create({
            data: {
               tenantId,
               userId: user.id,
               role
            }
         })
         successCount++
      } else if (existingTu.role !== role) {
         // Update role if changed
         await db.tenantUser.update({
            where: { id: existingTu.id },
            data: { role }
         })
         successCount++ // Treat as updated
      }
    }

    return NextResponse.json({ success: true, count: successCount })
  } catch (error: any) {
    console.error("Import GTK Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses data. Cek log sistem." }, { status: 500 })
  }
}
