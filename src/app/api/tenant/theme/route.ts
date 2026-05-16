import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { themeSchema } from "@/lib/validations/tenant"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = await parseBody(req, themeSchema)
    if (parsed.error) return parsed.error
    const { tenantId, theme, template } = parsed.data

    const tenantUser = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
      include: { tenant: true }
    })

    if (!tenantUser || !["owner", "admin"].includes(tenantUser.role)) {
      if (!session.user.isSuperAdmin) {
        return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
      }
    }

    if (template && template !== "default") {
      const tenant = tenantUser?.tenant || await db.tenant.findUnique({ where: { id: tenantId } })
      if (tenant?.plan === "free") {
        return NextResponse.json({ error: "Template premium membutuhkan langganan paket Pro/Enterprise" }, { status: 403 })
      }
    }



    const dataToUpdate: any = {}
    if (theme) dataToUpdate.theme = theme
    if (template) dataToUpdate.template = template

    const updated = await db.tenant.update({
      where: { id: tenantId },
      data: dataToUpdate,
    })

    return NextResponse.json({ theme: updated.theme, template: updated.template })
  } catch (error) {
    logger.error("Update theme failed", error, { path: "/api/tenant/theme" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
