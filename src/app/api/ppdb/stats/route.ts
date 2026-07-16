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

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }
    const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

    const [totalPendaftar, menungguVerifikasi, diterima, totalPendapatan] = await Promise.all([
      db.pendaftarPpdb.count({ where: { tenantId } }),
      db.pendaftarPpdb.count({ where: { tenantId, status: "MENUNGGU" } }),
      db.pendaftarPpdb.count({ where: { tenantId, status: "DITERIMA" } }),
      db.tagihanPpdb.aggregate({
        where: { 
          pendaftar: { tenantId },
          status: "LUNAS",
          jenis: "PENDAFTARAN"
        },
        _sum: { nominal: true }
      })
    ]);

    return NextResponse.json({
      totalPendaftar,
      menungguVerifikasi,
      diterima,
      pendapatanPendaftaran: totalPendapatan._sum.nominal || 0
    });
  } catch (error) {
    logger.error("GET PPDB Stats Error", error, { path: "/api/ppdb/stats" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
