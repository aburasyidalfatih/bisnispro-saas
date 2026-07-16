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

    const periods = await db.periodePpdb.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { pendaftar: true },
        },
      },
    });

    return NextResponse.json(periods);
  } catch (error) {
    logger.error("GET PPDB Periode Error", error, { path: "/api/ppdb/periode" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, nama, tanggalBuka, tanggalTutup, isActive, pengaturan } = body;

    if (!tenantId || !nama || !tanggalBuka || !tanggalTutup) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

    const period = await db.periodePpdb.create({
      data: {
        tenantId,
        nama,
        tanggalBuka: new Date(tanggalBuka),
        tanggalTutup: new Date(tanggalTutup),
        isActive: isActive ?? true,
        pengaturan,
      },
    });

    return NextResponse.json(period);
  } catch (error) {
    logger.error("POST PPDB Periode Error", error, { path: "/api/ppdb/periode" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
