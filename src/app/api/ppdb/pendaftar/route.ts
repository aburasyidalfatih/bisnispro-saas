import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { requireTenantMembership } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const status = searchParams.get("status");
    const periodeId = searchParams.get("periodeId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }
    const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (periodeId) where.periodeId = periodeId;

    const applicants = await db.pendaftarPpdb.findMany({
      where,
      take: 100,
      include: {
        periode: { select: { id: true, nama: true } },
        tagihan: {
          select: {
            id: true,
            status: true,
            nominal: true,
            pembayaran: { select: { id: true, status: true, nominal: true } }
          }
        },
        berkas: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applicants);
  } catch (error) {
    logger.error("GET PPDB Pendaftar Error", error, { path: "/api/ppdb/pendaftar" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
