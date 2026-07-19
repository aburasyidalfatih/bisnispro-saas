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
    const periodeId = searchParams.get("periodeId");

    if (!periodeId) {
      return NextResponse.json({ error: "Periode ID required" }, { status: 400 });
    }

    const requirements = await db.persyaratanBerkas.findMany({
      where: { periodeId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(requirements);
  } catch (error) {
    logger.error("GET PPDB Persyaratan Error", error, { path: "/api/ppdb/persyaratan" });
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
    const { periodeId, nama, isWajib, tipeFile } = body;

    if (!periodeId || !nama) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const requirement = await db.persyaratanBerkas.create({
      data: {
        periodeId,
        nama,
        isWajib: isWajib ?? true,
        tipeFile: tipeFile ?? "image/*,application/pdf",
      },
    });

    return NextResponse.json(requirement);
  } catch (error) {
    logger.error("POST PPDB Persyaratan Error", error, { path: "/api/ppdb/persyaratan" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const existing = await db.persyaratanBerkas.findUnique({
      where: { id },
      include: { periode: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error: accessError } = await requireTenantMembership(existing.periode.tenantId);
    if (accessError) return accessError;

    await db.persyaratanBerkas.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("DELETE PPDB Persyaratan Error", error, { path: "/api/ppdb/persyaratan" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
