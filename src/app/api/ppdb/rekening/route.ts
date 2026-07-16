import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { requireTenantMembership } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const accounts = await db.rekening.findMany({
      where: { tenantId },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    logger.error("GET Rekening Error", error, { path: "/api/ppdb/rekening" });
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
    const { tenantId, namaBank, nomorRekening, atasNama } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }
    const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

    const account = await db.rekening.create({
      data: {
        tenantId,
        namaBank,
        nomorRekening,
        atasNama,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    logger.error("POST Rekening Error", error, { path: "/api/ppdb/rekening" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

