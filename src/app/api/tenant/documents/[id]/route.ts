import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

  const isSuperAdmin = session.user.isSuperAdmin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    const allowedRoles = ["owner", "admin", "operator"]
    if (!tu || !allowedRoles.includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin untuk menghapus dokumen" }, { status: 403 })
    }
  }

  try {
    await db.document.deleteMany({
      where: {
        id: params.id,
        tenantId,
      }
    })

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true }
    })
    if (tenant) {
      const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
      await invalidatePublicTenantCache(tenant.slug)
    }

    return NextResponse.json({ message: "Dokumen berhasil dihapus" })
  } catch (error) {
    logger.error("Document delete failed", error, { documentId: params.id })
    return NextResponse.json({ error: "Gagal menghapus dokumen" }, { status: 500 })
  }
}
