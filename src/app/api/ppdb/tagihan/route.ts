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

    const billings = await db.tagihanPpdb.findMany({
      where: {
        pendaftar: { tenantId }
      },
      include: {
        pendaftar: {
          select: {
            namaLengkap: true,
            noPendaftaran: true
          }
        },
        pembayaran: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(billings);
  } catch (error) {
    logger.error("GET PPDB Tagihan Error", error, { path: "/api/ppdb/tagihan" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
