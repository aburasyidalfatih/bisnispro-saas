import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exportToExcel } from "@/features/export/services/export.service"
import { exportSchema } from "@/features/super-admin/schemas/super-admin.schema"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = await parseBody(req, exportSchema)
    if (parsed.error) return parsed.error
    const { data, columns, filename } = parsed.data

    const result = await exportToExcel(data, columns, filename)
    if (!result.success || !result.buffer) {
      return NextResponse.json({ error: result.error || "Gagal membuat file excel" }, { status: 500 })
    }

    return new NextResponse(result.buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename || "export"}.xlsx"`,
      },
    })
  } catch (error) {
    logger.error("Export failed", error, { path: "/api/export" })
    return NextResponse.json({ error: "Export gagal" }, { status: 500 })
  }
}
